import EditableContent from './EditableContent';

export default function Rejonizacja() {
  return (
    <section>
      <EditableContent
        pageKey="rejonizacja"
        sectionKey="page-title"
        elementType="h2"
        defaultContent="Rejonizacja tablic rejestracyjnych"
      >
        <h2>Rejonizacja tablic rejestracyjnych</h2>
      </EditableContent>
      <EditableContent
        pageKey="rejonizacja"
        sectionKey="intro-text-1"
        elementType="p"
        defaultContent="Każdy polski pojazd ma przypisany konkretny symbol regionu — to te dwie litery na tablicy, które od razu zdradzają, skąd pochodzi auto. System wprowadzono w 2000 roku, zastępując stare oznaczenia z czasów PRL-u i zaborów. Dawniej tablice mówiły tylko o powiecie, teraz — o całym województwie."
      >
        <p>
          Każdy polski pojazd ma przypisany konkretny symbol regionu — to te dwie litery na tablicy, które od razu zdradzają, skąd pochodzi auto. System wprowadzono w 2000 roku, zastępując stare oznaczenia z czasów PRL-u i zaborów. Dawniej tablice mówiły tylko o powiecie, teraz — o całym województwie.
        </p>
      </EditableContent>
      <EditableContent
        pageKey="rejonizacja"
        sectionKey="intro-text-2"
        elementType="p"
        defaultContent="Na stronie znajdziesz pełną listę kodów z podziałem na województwa, interaktywną mapkę oraz informacje o tym, jak zmieniały się granice administracyjne na przestrzeni lat. Jeśli kiedyś przepisywałeś tablice po zmianie miejsca zameldowania, wiesz, że procedura jest prosta, ale diabeł tkwi w szczegółach."
      >
        <p>
          Na stronie znajdziesz pełną listę kodów z podziałem na województwa, interaktywną mapkę oraz informacje o tym, jak zmieniały się granice administracyjne na przestrzeni lat. Jeśli kiedyś przepisywałeś tablice po zmianie miejsca zameldowania, wiesz, że procedura jest prosta, ale diabeł tkwi w szczegółach.
        </p>
      </EditableContent>
      <EditableContent
        pageKey="rejonizacja"
        sectionKey="features-title"
        elementType="h3"
        defaultContent="Co tutaj znajdziesz"
      >
        <h3>Co tutaj znajdziesz</h3>
      </EditableContent>
      <ul>
        <li><strong><EditableContent
          pageKey="rejonizacja"
          sectionKey="feature-codes-label"
          elementType="span"
          defaultContent="Tabela kodów"
        />
        </strong> — wszystkie oznaczenia od BI po ZA z przypisanymi miastami i województwami</li>
        <li><strong><EditableContent
          pageKey="rejonizacja"
          sectionKey="feature-map-label"
          elementType="span"
          defaultContent="Mapka interaktywna"
        />
        </strong> — kliknij region, zobaczysz, jakie tablice tam obowiązują</li>
        <li><strong><EditableContent
          pageKey="rejonizacja"
          sectionKey="feature-faq-label"
          elementType="span"
          defaultContent="FAQ"
        />
        </strong> — odpowiedzi na pytania o zmianę tablic, koszty i dokumenty</li>
      </ul>
      <EditableContent
        pageKey="rejonizacja"
        sectionKey="cta-text"
        elementType="p"
        defaultContent="Masz pod ręką stare tablice, dokumenty z różnych lat albo zdjęcia nietypowych oznaczeń? Podziel się nimi — chętnie dodamy je do kolekcji."
      >
        <p>
          Masz pod ręką stare tablice, dokumenty z różnych lat albo zdjęcia nietypowych oznaczeń? Podziel się nimi — chętnie dodamy je do kolekcji.
        </p>
      </EditableContent>
    </section>
  );
}
