import EditableContent from './EditableContent';

export default function History() {
  return (
    <section>
      <EditableContent
        pageKey="history"
        sectionKey="page-title"
        elementType="h2"
        defaultContent="Historia"
      >
        <h2>Historia</h2>
      </EditableContent>
      <EditableContent
        pageKey="history"
        sectionKey="intro-text"
        elementType="p"
        defaultContent="Tutaj znajdziesz krótką historię czarnych tablic rejestracyjnych na terenie województwa Przemyskiego."
      >
        <p>
          Tutaj znajdziesz krótką historię czarnych tablic rejestracyjnych na terenie województwa Przemyskiego.
        </p>
      </EditableContent>
      <EditableContent
        pageKey="history"
        sectionKey="pre-1975-title"
        elementType="h3"
        defaultContent="WSTĘP:PODZIAŁ ADMINISTRACYJNY WOJEWÓDZTWA PRZEMYSKIEGO (LATA 1975-1998):"
      >
        <h3>WSTĘP:PODZIAŁ ADMINISTRACYJNY WOJEWÓDZTWA PRZEMYSKIEGO (LATA 1975-1998):</h3>
      </EditableContent>
      <EditableContent
        pageKey="history"
        sectionKey="pre-1975-intro"
        elementType="p"
        defaultContent="Utworzone 1.06.1975 r. woj. przemyskie dzieliło się na następujące miasta, miasta i gminy oraz gminy:"
      >
        <p>Utworzone 1.06.1975 r. woj. przemyskie dzieliło się na następujące miasta, miasta i gminy oraz gminy:</p>
      </EditableContent>
      <ul>
        <li>miasta: Przemyśl, Jarosław, Lubaczów, Przeworsk.</li> <br />
        <li>miasta i gminy: Cieszanów, Dynów, Kańczuga, Radymno, Sieniawa, Narol (od 1996r.), Oleszyce (od 1989r.).</li><br />
        <li>gminy: Adamówka, Bircza, Chłopice, Dubiecko, Fredropol, Gać, Horyniec, Jarosław, Jawornik Polski, Krasiczyn, Krzywcza, Laszki, Lubaczów, Medyka, Narol (od 1996 r. miasto i gmina Narol), Oleszyce (od 1989 r. miasto i gmina Oleszyce), Orły, Pawłosiów, Pruchnik, Przemyśl, Przeworsk, Rokietnica, Roźwienica, Stary Dzików, Stubno, Tryńcza, Wiązownica, Wielkie Oczy, Zarzecze, Żurawica.</li><br />
      </ul>
      <EditableContent
        pageKey="history"
        sectionKey="pre-1991-note"
        elementType="p"
        defaultContent="* W 01.07.1991 r. Podzielono miasto i gminę Dynów oraz miasto i gminę Radymno na dwie jednostki administracyjne."
      >
        <p>
          * W 01.07.1991 r. Podzielono miasto i gminę Dynów oraz miasto i gminę Radymno na dwie jednostki administracyjne.
        </p>
      </EditableContent>
      <EditableContent
        pageKey="history"
        sectionKey="post-reform-title"
        elementType="h3"
        defaultContent="WOJEWÓDZTWO PRZEMYSKIE PO REFORMIE WPROWADZAJĄCEJ 16 WOJEWÓDZTW"
      >
        <h3>WOJEWÓDZTWO PRZEMYSKIE PO REFORMIE WPROWADZAJĄCEJ 16 WOJEWÓDZTW</h3>
      </EditableContent>
      <EditableContent
        pageKey="history"
        sectionKey="post-reform-intro"
        elementType="p"
        defaultContent="01.01.1999 wszedł nowy podział administacyjny wprowadzający 16 województw. Tereny woj. Przemyskiego zostały włączone do nowo powstałego woj, Podkarpackiego, a na jego terenach powstały następujące powiaty:"
      >
        <p>01.01.1999 wszedł nowy podział administacyjny wprowadzający 16 województw. Tereny woj. Przemyskiego zostały włączone do nowo powstałego woj, Podkarpackiego, a na jego terenach powstały następujące powiaty:</p>
      </EditableContent>
      <ul>
        <li>miasto Przemyśl (grodzki)</li>
        <li>Przemyski (ziemski) w który wchodziły gminy: Bircza, Dubiecko, Fredropol, Krasiczyn, Krzywcza, Medyka, Orły, Przemyśl, Stubno, Żurawica.</li>
        <li>Jarosławski w który wchodziły: miasta Jarosław i Radymno, gminy: Chłopice, Jarosław, Laszki, Pawłosiów, Pruchnik, Radymno, Rokietnica, Roźwienica, Wiązownica.</li>
        <li>Przeworski w który wchodziły miasta i gminy: Kańczuga, Sieniawa, gminy: Adamówka, Gać, Jawornik Polski, Przeworsk, Tryńcza, Zarzecze.</li>
        <li>Lubaczowski w który wchodziły miasta i gminy: Cieszanów, Narol, Oleszyce, gminy: Horyniec (od 1.01.2002 r. Horyniec-Zdrój), Lubaczów, Stary Dzików, Wielkie Oczy.</li>
      </ul>
    </section>
  );
}
