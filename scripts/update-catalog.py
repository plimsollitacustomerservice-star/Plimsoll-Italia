#!/usr/bin/env python3
"""
Script di aggiornamento automatico del Catalogo Plimsoll
Sincronizza i dati tra i file locali e il repository GitHub
"""

import json
import csv
import os
import sys
import requests
import pandas as pd
from datetime import datetime
from pathlib import Path
import argparse

class PlimsollCatalogUpdater:
    def __init__(self, repo_path=None):
        self.repo_path = Path(repo_path) if repo_path else Path.cwd()
        self.data_dir = self.repo_path / 'data'
        self.uploads_dir = self.repo_path / 'uploads'
        self.backup_dir = self.data_dir / 'backup'
        
        # Crea directory se non esistono
        self.data_dir.mkdir(exist_ok=True)
        self.uploads_dir.mkdir(exist_ok=True)
        self.backup_dir.mkdir(exist_ok=True)
        
        self.sectors_file = self.data_dir / 'sectors.json'
        self.mapping_file = self.data_dir / 'ateco-nace.json'
        
        self.sectors = []
        self.nace_mapping = {}
        self.ateco_mapping = {}
        
        self.load_data()
    
    def load_data(self):
        """Carica i dati esistenti"""
        try:
            if self.sectors_file.exists():
                with open(self.sectors_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.sectors = data.get('sectors', [])
            
            if self.mapping_file.exists():
                with open(self.mapping_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.nace_mapping = data.get('nace', {})
                    self.ateco_mapping = data.get('ateco', {})
            else:
                self.create_default_mappings()
                
        except Exception as e:
            print(f"Errore caricamento dati: {e}")
            self.sectors = []
            self.create_default_mappings()
    
    def create_default_mappings(self):
        """Crea mappature NACE/ATECO predefinite"""
        self.nace_mapping = {
            'A': 'Agricoltura, silvicoltura e pesca',
            'B': 'Estrazione di minerali da cave e miniere',
            'C': 'Attività manifatturiere',
            'D': 'Fornitura di energia elettrica, gas, vapore e aria condizionata',
            'E': 'Fornitura di acqua; reti fognarie, attività di gestione dei rifiuti',
            'F': 'Costruzioni',
            'G': 'Commercio all\'ingrosso e al dettaglio; riparazione di autoveicoli',
            'H': 'Trasporto e magazzinaggio',
            'I': 'Attività dei servizi di alloggio e di ristorazione',
            'J': 'Servizi di informazione e comunicazione',
            'K': 'Attività finanziarie e assicurative',
            'L': 'Attività immobiliari',
            'M': 'Attività professionali, scientifiche e tecniche',
            'N': 'Noleggio, agenzie di viaggio, servizi di supporto alle imprese',
            'O': 'Amministrazione pubblica e difesa; assicurazione sociale obbligatoria',
            'P': 'Istruzione',
            'Q': 'Sanità e assistenza sociale',
            'R': 'Attività artistiche, sportive, di intrattenimento e divertimento',
            'S': 'Altre attività di servizi',
            'T': 'Attività di famiglie e convivenze come datori di lavoro',
            'U': 'Organizzazioni ed organismi extraterritoriali'
        }
        
        self.ateco_mapping = {
            'A': '01-03', 'B': '05-09', 'C': '10-33', 'D': '35', 'E': '36-39',
            'F': '41-43', 'G': '45-47', 'H': '49-53', 'I': '55-56', 'J': '58-63',
            'K': '64-66', 'L': '68', 'M': '69-75', 'N': '77-82', 'O': '84',
            'P': '85', 'Q': '86-88', 'R': '90-93', 'S': '94-96', 'T': '97-98', 'U': '99'
        }
        
        self.save_mappings()
    
    def save_mappings(self):
        """Salva le mappature NACE/ATECO"""
        mapping_data = {
            'lastUpdated': datetime.now().isoformat(),
            'nace': self.nace_mapping,
            'ateco': self.ateco_mapping
        }
        
        with open(self.mapping_file, 'w', encoding='utf-8') as f:
            json.dump(mapping_data, f, ensure_ascii=False, indent=2)
    
    def process_upload_files(self):
        """Processa tutti i file nella directory uploads"""
        processed_files = []
        
        for file_path in self.uploads_dir.glob('*'):
            if file_path.suffix.lower() in ['.csv', '.xlsx', '.xls']:
                try:
                    sectors = self.process_file(file_path)
                    merged, added = self.merge_sectors(sectors)
                    
                    processed_files.append({
                        'filename': file_path.name,
                        'sectors_found': len(sectors),
                        'added': added,
                        'merged': merged
                    })
                    
                    # Sposta il file elaborato
                    processed_dir = self.uploads_dir / 'processed'
                    processed_dir.mkdir(exist_ok=True)
                    file_path.rename(processed_dir / file_path.name)
                    
                except Exception as e:
                    print(f"Errore elaborazione {file_path.name}: {e}")
                    processed_files.append({
                        'filename': file_path.name,
                        'error': str(e)
                    })
        
        return processed_files
    
    def process_file(self, file_path):
        """Processa un singolo file"""
        if file_path.suffix.lower() == '.csv':
            return self.process_csv(file_path)
        else:
            return self.process_excel(file_path)
    
    def process_csv(self, file_path):
        """Processa file CSV"""
        sectors = []
        
        try:
            # Prova diverse codifiche
            encodings = ['utf-8', 'latin-1', 'cp1252']
            df = None
            
            for encoding in encodings:
                try:
                    df = pd.read_csv(file_path, encoding=encoding)
                    break
                except UnicodeDecodeError:
                    continue
            
            if df is None:
                raise ValueError("Impossibile decodificare il file CSV")
            
            for _, row in df.iterrows():
                sector = self.normalize_sector_data(row.to_dict())
                if sector and sector.get('name'):
                    sectors.append(sector)
                    
        except Exception as e:
            raise Exception(f"Errore lettura CSV: {e}")
        
        return sectors
    
    def process_excel(self, file_path):
        """Processa file Excel"""
        sectors = []
        
        try:
            df = pd.read_excel(file_path, engine='openpyxl' if file_path.suffix == '.xlsx' else None)
            
            for _, row in df.iterrows():
                sector = self.normalize_sector_data(row.to_dict())
                if sector and sector.get('name'):
                    sectors.append(sector)
                    
        except Exception as e:
            raise Exception(f"Errore lettura Excel: {e}")
        
        return sectors
    
    def normalize_sector_data(self, raw_data):
        """Normalizza i dati del settore"""
        # Mappature colonne comuni
        field_mapping = {
            'nome': 'name', 'name': 'name', 'sector': 'name', 'settore': 'name',
            'paese': 'country', 'country': 'country', 'nazione': 'country',
            'descrizione': 'description', 'description': 'description',
            'nace': 'nace', 'ateco': 'ateco',
            'keywords': 'keywords', 'parole chiave': 'keywords'
        }
        
        sector = {}
        for original_key, value in raw_data.items():
            if pd.isna(value) or value == '':
                continue
                
            normalized_key = field_mapping.get(str(original_key).lower().strip())
            if normalized_key:
                sector[normalized_key] = str(value).strip()
        
        # Genera campi mancanti
        if 'name' in sector:
            sector['id'] = self.generate_id()
            sector['nace'] = sector.get('nace') or self.infer_nace_from_name(sector['name'])
            sector['ateco'] = sector.get('ateco') or self.infer_ateco_from_nace(sector['nace'])
            sector['description'] = sector.get('description') or self.generate_description(sector['name'])
            sector['keywords'] = sector.get('keywords') or self.generate_keywords(sector['name'])
            sector['lastUpdated'] = datetime.now().isoformat()
        
        return sector
    
    def generate_id(self):
        """Genera ID univoco"""
        import time
        import random
        return f"sector_{int(time.time())}_{random.randint(1000, 9999)}"
    
    def infer_nace_from_name(self, name):
        """Inferisce codice NACE dal nome del settore"""
        name_lower = name.lower()
        
        nace_keywords = {
            'A': ['agricol', 'farm', 'pesca', 'allevamento', 'coltiva', 'viticoltura'],
            'C': ['fabbrica', 'produz', 'manufactur', 'industry', 'manifat', 'lavorazione'],
            'F': ['costruz', 'ediliz', 'building', 'immobil'],
            'G': ['commercio', 'vendita', 'retail', 'wholesale', 'negozi', 'concession'],
            'H': ['trasport', 'logistic', 'shipping', 'autotrasport'],
            'I': ['hotel', 'ristoran', 'bar', 'albergo', 'accommodation'],
            'J': ['software', 'informatica', 'computer', 'telecomunicaz', 'internet'],
            'K': ['banca', 'finanz', 'assicuraz', 'credito', 'investment'],
            'M': ['consulent', 'professional', 'tecnic', 'ingegneria', 'architect'],
            'R': ['sport', 'entertainment', 'giochi', 'cultura', 'spettacolo']
        }
        
        for nace_code, keywords in nace_keywords.items():
            if any(keyword in name_lower for keyword in keywords):
                return nace_code
        
        return 'S'  # Default
    
    def infer_ateco_from_nace(self, nace_section):
        """Inferisce codice ATECO da sezione NACE"""
        return self.ateco_mapping.get(nace_section, '96.09')
    
    def generate_description(self, name):
        """Genera descrizione del settore"""
        name_lower = name.lower()
        
        templates = {
            'concessionari': 'Concessionarie autorizzate per la vendita di autoveicoli e servizi post-vendita.',
            'autofficin': 'Officine specializzate nella riparazione e manutenzione di autoveicoli.',
            'consulenz': 'Società di consulenza specializzate in servizi professionali alle imprese.',
            'software': 'Aziende di sviluppo software e servizi informatici.',
            'costruz': 'Imprese di costruzioni e edilizia.',
            'commercio': 'Aziende commerciali per distribuzione e vendita di prodotti.',
            'hotel': 'Strutture ricettive e servizi di ospitalità.',
            'trasport': 'Aziende di trasporto e logistica.'
        }
        
        for keyword, template in templates.items():
            if keyword in name_lower:
                return template
        
        return f"Aziende del settore {name} che operano nel mercato di riferimento."
    
    def generate_keywords(self, name):
        """Genera keywords per il settore"""
        words = name.lower().split()
        common_words = ['di', 'del', 'della', 'dei', 'delle', 'da', 'in', 'con', 'per', 'e']
        keywords = [w for w in words if len(w) > 2 and w not in common_words]
        return ', '.join(keywords[:5])  # Massimo 5 keywords
    
    def merge_sectors(self, new_sectors):
        """Unisce nuovi settori con quelli esistenti"""
        added = 0
        merged = 0
        
        for new_sector in new_sectors:
            existing = None
            for sector in self.sectors:
                if (sector['name'].lower() == new_sector['name'].lower() and
                    sector.get('country') == new_sector.get('country')):
                    existing = sector
                    break
            
            if existing:
                # Aggiorna solo campi vuoti
                updated = False
                for key, value in new_sector.items():
                    if value and not existing.get(key):
                        existing[key] = value
                        updated = True
                
                if updated:
                    existing['lastUpdated'] = datetime.now().isoformat()
                    merged += 1
            else:
                self.sectors.append(new_sector)
                added += 1
        
        return merged, added
    
    def create_backup(self):
        """Crea backup dei dati correnti"""
        backup_filename = f"sectors_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        backup_path = self.backup_dir / backup_filename
        
        backup_data = {
            'backupDate': datetime.now().isoformat(),
            'totalSectors': len(self.sectors),
            'sectors': self.sectors
        }
        
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, ensure_ascii=False, indent=2)
        
        print(f"Backup creato: {backup_path}")
        return backup_path
    
    def save_data(self):
        """Salva tutti i dati"""
        # Crea backup prima di salvare
        self.create_backup()
        
        # Salva dati principali
        data = {
            'lastUpdated': datetime.now().isoformat(),
            'totalSectors': len(self.sectors),
            'sectors': self.sectors,
            'statistics': self.get_statistics()
        }
        
        with open(self.sectors_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Dati salvati: {len(self.sectors)} settori")
    
    def get_statistics(self):
        """Calcola statistiche del catalogo"""
        if not self.sectors:
            return {}
        
        total = len(self.sectors)
        with_description = sum(1 for s in self.sectors if s.get('description'))
        countries = len(set(s.get('country', '') for s in self.sectors if s.get('country')))
        nace_sections = len(set(s.get('nace', '')[:1] for s in self.sectors if s.get('nace')))
        
        return {
            'total': total,
            'withDescription': with_description,
            'missingDescription': total - with_description,
            'countries': countries,
            'naceSections': nace_sections
        }
    
    def export_csv(self, output_path=None):
        """Esporta dati in formato CSV"""
        if not output_path:
            output_path = self.data_dir / f"plimsoll_catalog_{datetime.now().strftime('%Y%m%d')}.csv"
        
        if not self.sectors:
            print("Nessun settore da esportare")
            return
        
        df = pd.DataFrame(self.sectors)
        df.to_csv(output_path, index=False, encoding='utf-8')
        print(f"CSV esportato: {output_path}")
        return output_path
    
    def export_excel(self, output_path=None):
        """Esporta dati in formato Excel"""
        if not output_path:
            output_path = self.data_dir / f"plimsoll_catalog_{datetime.now().strftime('%Y%m%d')}.xlsx"
        
        if not self.sectors:
            print("Nessun settore da esportare")
            return
        
        df = pd.DataFrame(self.sectors)
        df.to_excel(output_path, index=False, engine='openpyxl')
        print(f"Excel esportato: {output_path}")
        return output_path
    
    def run_update(self):
        """Esegue l'aggiornamento completo"""
        print("=== Aggiornamento Catalogo Plimsoll ===")
        print(f"Repository: {self.repo_path}")
        print(f"Settori attuali: {len(self.sectors)}")
        
        # Processa file caricati
        processed_files = self.process_upload_files()
        
        if processed_files:
            print("\nFile processati:")
            total_added = 0
            total_merged = 0
            
            for file_info in processed_files:
                if 'error' in file_info:
                    print(f"❌ {file_info['filename']}: {file_info['error']}")
                else:
                    print(f"✅ {file_info['filename']}: "
                          f"{file_info['sectors_found']} settori trovati, "
                          f"{file_info['added']} aggiunti, "
                          f"{file_info['merged']} aggiornati")
                    total_added += file_info['added']
                    total_merged += file_info['merged']
            
            print(f"\nTotale: {total_added} nuovi settori, {total_merged} aggiornamenti")
        else:
            print("Nessun file da processare")
        
        # Salva dati
        self.save_data()
        
        # Esporta report
        stats = self.get_statistics()
        print(f"\n=== Statistiche Finali ===")
        print(f"Settori totali: {stats.get('total', 0)}")
        print(f"Con descrizione: {stats.get('withDescription', 0)}")
        print(f"Da completare: {stats.get('missingDescription', 0)}")
        print(f"Paesi: {stats.get('countries', 0)}")
        print(f"Sezioni NACE: {stats.get('naceSections', 0)}")
        
        return True

def main():
    parser = argparse.ArgumentParser(description='Aggiorna il Catalogo Plimsoll')
    parser.add_argument('--repo-path', type=str, help='Percorso del repository')
    parser.add_argument('--export-csv', action='store_true', help='Esporta CSV')
    parser.add_argument('--export-excel', action='store_true', help='Esporta Excel')
    
    args = parser.parse_args()
    
    try:
        updater = PlimsollCatalogUpdater(args.repo_path)
        success = updater.run_update()
        
        if args.export_csv:
            updater.export_csv()
        
        if args.export_excel:
            updater.export_excel()
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"Errore durante l'aggiornamento: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
