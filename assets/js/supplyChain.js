function renderSupplyChain(studyCode, mapping) {
  ['upstream', 'correlati', 'downstream'].forEach(section => {
    const area = document.getElementById('sc-' + section);
    area.innerHTML = "";
    mapping[section].forEach(rel => {
      area.innerHTML += `
        <div class="sc-item ${rel.status === "available" ? "sc-available" : "sc-missing"}">
          <strong>${rel.name_native}</strong> / <em>${rel.name_en}</em> <br>
          <span>${rel.desc_native}</span>
          <div>
            <span class="badge sc-badge-${rel.status}">
              ${rel.status === "available" ? "Disponibile" : "Invia richiesta"}
            </span>
            <span class="badge badge-secondary">ATECO ${rel.ateco} • NACE ${rel.nace}</span>
            ${
              rel.status === "missing"
              ? `<a href="mailto:info@plimsoll.it?subject=Richiesta fattibilità studio: ${rel.name_en} [${rel.ateco}]" class="sc-mail-req">Richiedi fattibilità studio</a>`
              : `<a href="https://www.plimsoll.it/analisi" class="btn btn-success btn-sm" target="_blank">Vai al servizio</a>`
            }
          </div>
        </div>
      `;
    });
  });
}
