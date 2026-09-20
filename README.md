# Bacău.NET iPhone PWA — V3.3

Full-text Reader fix:
- păstrează `content.rendered` primit din WordPress REST în obiectul fiecărei știri;
- pentru articolele fără body în feed, cere endpoint-ul individual WordPress cu `_embed=1`;
- dacă browserul blochează cererea directă, încearcă aceeași cerere prin fallback-ul proxy deja folosit de aplicație;
- excerpt-ul este folosit numai ca ultim fallback;
- cache/version bump la v33.
