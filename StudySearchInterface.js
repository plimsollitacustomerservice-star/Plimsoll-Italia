import React, { useState, useEffect } from 'react';
import { Form, InputGroup, ListGroup, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import SupplyChainExplorer from './SupplyChainExplorer';

const StudySearchInterface = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSupplyChain, setShowSupplyChain] = useState(false);

  // Debounced search effect
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.length >= 2) {
        performSearch(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const performSearch = async (query) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/studies/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Errore nella ricerca');
      }
      
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      setError('Errore durante la ricerca. Riprova più tardi.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudySelect = (study) => {
    setSelectedStudy(study);
    setShowSupplyChain(true);
    setSearchResults([]); // Nascondi i risultati di ricerca
  };

  const handleBackToSearch = () => {
    setShowSupplyChain(false);
    setSelectedStudy(null);
  };

  const handleVisitPlimsoll = () => {
    window.open('https://www.plimsoll.it', '_blank');
  };

  const handleViewStudyInfo = () => {
    window.open('https://p0.me-page.com/project/289223/f52161219504742f83c20630d9133419', '_blank');
  };

  const renderSearchResults = () => {
    if (isLoading) {
      return (
        <div className="search-loading text-center py-3">
          <Spinner animation="border" size="sm" className="me-2" />
          Ricerca in corso...
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      );
    }

    if (searchResults.length === 0 && searchTerm.length >= 2) {
      return (
        <Alert variant="info" className="mt-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>Nessun risultato trovato</strong>
              <p className="mb-0 mt-1">
                Prova con termini diversi o contatta Plimsoll per richiedere uno studio specifico.
              </p>
            </div>
            <div>
              <Button variant="outline-primary" size="sm" onClick={handleVisitPlimsoll}>
                Contatta Plimsoll
              </Button>
            </div>
          </div>
        </Alert>
      );
    }

    return (
      <ListGroup className="mt-3 search-results">
        {searchResults.map((study) => (
          <ListGroup.Item 
            key={study.id} 
            className="d-flex justify-content-between align-items-start study-result-item"
            action
            onClick={() => handleStudySelect(study)}
          >
            <div className="study-result-info flex-grow-1">
              <div className="d-flex align-items-start justify-content-between">
                <div>
                  <h6 className="study-result-title">{study.name_it}</h6>
                  <p className="study-result-subtitle text-muted mb-2">{study.name_en}</p>
                  
                  <div className="study-result-meta">
                    <Badge bg="secondary" className="me-2">{study.market}</Badge>
                    {study.ateco && (
                      <small className="text-muted">
                        ATECO: {study.ateco}
                        {study.nace && ` | NACE: ${study.nace}`}
                      </small>
                    )}
                  </div>

                  {study.keywords && study.keywords.length > 0 && (
                    <div className="study-keywords mt-2">
                      {study.keywords.slice(0, 3).map((keyword, idx) => (
                        <Badge key={idx} bg="light" text="dark" className="me-1 mb-1">
                          {keyword}
                        </Badge>
                      ))}
                      {study.keywords.length > 3 && (
                        <Badge bg="light" text="muted" className="me-1 mb-1">
                          +{study.keywords.length - 3} altri
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="study-result-actions">
                  <div className="d-flex flex-column gap-2">
                    {study.status === 'available' ? (
                      <Badge bg="success">🟢 Disponibile</Badge>
                    ) : (
                      <Badge bg="warning">🟡 Su richiesta</Badge>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStudySelect(study);
                      }}
                    >
                      Visualizza Filiera
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    );
  };

  if (showSupplyChain && selectedStudy) {
    return (
      <div className="study-search-interface">
        {/* Header con breadcrumb */}
        <div className="search-header mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={handleBackToSearch}
                className="me-3"
              >
                ← Torna alla ricerca
              </Button>
              <span className="text-muted">
                Ricerca: "{searchTerm}" → {selectedStudy.name_it}
              </span>
            </div>
            <div>
              <Button 
                variant="outline-info" 
                size="sm" 
                onClick={handleViewStudyInfo}
                className="me-2"
              >
                Info Servizi
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleVisitPlimsoll}
              >
                Sito Plimsoll
              </Button>
            </div>
          </div>
        </div>

        {/* Supply Chain Explorer */}
        <SupplyChainExplorer 
          selectedStudy={selectedStudy}
          onStudySelect={handleStudySelect}
        />
      </div>
    );
  }

  return (
    <div className="study-search-interface">
      {/* Header */}
      <div className="search-header mb-4">
        <div className="row align-items-center">
          <div className="col-md-8">
            <h2 className="search-title">🔍 Ricerca Studi Plimsoll</h2>
            <p className="search-subtitle text-muted">
              Trova studi di mercato e analizza le filiere industriali correlate
            </p>
          </div>
          <div className="col-md-4 text-md-end">
            <Button 
              variant="outline-primary" 
              onClick={handleViewStudyInfo}
              className="me-2"
            >
              📋 Info Servizi
            </Button>
            <Button 
              variant="primary" 
              onClick={handleVisitPlimsoll}
            >
              🌐 Sito Plimsoll
            </Button>
          </div>
        </div>
      </div>

      {/* Search Box */}
      <div className="search-box-container">
        <Form>
          <InputGroup size="lg">
            <InputGroup.Text>
              <i className="fas fa-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Cerca studi per settore, prodotto o mercato (es: automotive, food processing, construction...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <Button 
                variant="outline-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setSearchResults([]);
                }}
              >
                ✕
              </Button>
            )}
          </InputGroup>
        </Form>

        {/* Search Help */}
        {searchTerm.length === 0 && (
          <div className="search-help mt-3">
            <div className="row">
              <div className="col-md-12">
                <h6 className="text-muted">💡 Esempi di ricerca:</h6>
                <div className="search-examples">
                  {[
                    'automotive parts',
                    'food processing',
                    'construction materials',
                    'textile manufacturing',
                    'pharmaceutical',
                    'renewable energy',
                    'logistics',
                    'packaging'
                  ].map((example, idx) => (
                    <Badge 
                      key={idx}
                      bg="light" 
                      text="dark" 
                      className="me-2 mb-2 search-example-badge"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSearchTerm(example)}
                    >
                      {example}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {renderSearchResults()}

      {/* Info Section */}
      {searchResults.length === 0 && searchTerm.length === 0 && (
        <div className="info-section mt-5">
          <div className="row">
            <div className="col-md-6">
              <div className="info-card h-100">
                <h5>🏭 Filiere Industriali</h5>
                <p>
                  Il nostro sistema identifica automaticamente studi correlati lungo 
                  tutta la filiera industriale, dai fornitori di materie prime 
                  ai servizi post-vendita.
                </p>
                <ul className="info-list">
                  <li>Automotive (27 studi mappati)</li>
                  <li>Agroalimentare (20 studi mappati)</li>
                  <li>Costruzioni (14 studi mappati)</li>
                  <li>Tessile e Moda (11 studi mappati)</li>
                  <li>Farmaceutica (10 studi mappati)</li>
                  <li>Energia (8 studi mappati)</li>
                </ul>
              </div>
            </div>
            <div className="col-md-6">
              <div className="info-card h-100">
                <h5>📊 Studi Correlati</h5>
                <p>
                  Per ogni studio, visualizzi automaticamente:
                </p>
                <ul className="info-list">
                  <li><strong>⬅️ Upstream:</strong> Fornitori e materie prime</li>
                  <li><strong>🎯 Stesso livello:</strong> Concorrenti e complementari</li>
                  <li><strong>➡️ Downstream:</strong> Clienti e distribuzione</li>
                  <li><strong>🌍 Altri mercati:</strong> Stessi settori in paesi diversi</li>
                  <li><strong>🟡 Gap analysis:</strong> Studi mancanti da richiedere</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudySearchInterface;