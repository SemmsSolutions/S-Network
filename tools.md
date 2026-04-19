# tools.md — BuildConnect Tooling Stack

## Backend
| Tool | Version | Use |
|---|---|---|
| Supabase | Latest | DB + Auth + Storage + Realtime |
| PostgreSQL | 15 | Primary database |
| PostGIS | 3.x | Geo/location queries |
| pg_trgm | Built-in | Fuzzy text search |
| Deno / Edge Functions | Latest | API business logic |

## Web Frontend
| Tool | Version | Use |
|---|---|---|
| Angular | 17+ | Web framework |
| Angular Universal | 17+ | SSR for SEO |
| Tailwind CSS | 3.x | Utility-first styling |
| @supabase/supabase-js | 2.x | Supabase client |
| RxJS | 7.x | Reactive state |

## Mobile Frontend
| Tool | Version | Use |
|---|---|---|
| Flutter | 3.x | Cross-platform mobile |
| Dart | 3.x | Language |
| supabase_flutter | Latest | Supabase client |
| riverpod | 2.x | State management |
| go_router | Latest | Navigation |
| geolocator | Latest | GPS location |
| flutter_local_notifications | Latest | Lead push alerts |
| cached_network_image | Latest | Image loading |

## Development Tools
| Tool | Use |
|---|---|
| Supabase CLI | Migrations, local dev, function deploy |
| Supabase Studio | Visual DB management, RLS policy testing |
| Postman | API testing |
| VS Code | Primary IDE |
| Android Studio | Flutter Android emulator |
| Xcode | Flutter iOS builds |

## CI/CD
| Tool | Use |
|---|---|
| GitHub | Source control |
| GitHub Actions | Auto-deploy Angular to Vercel on push |
| Vercel | Angular web hosting |
| Play Store | Android app distribution |
| App Store Connect | iOS app distribution |

## Analytics & Monitoring
| Tool | Use |
|---|---|
| PostHog | Product analytics, funnel tracking |
| Sentry | Error monitoring (web + mobile) |
| Supabase Dashboard | DB health, slow query logs |

## AI Development Tools
| Tool | Use |
|---|---|
| Antigravity | Agentic coding workflows |
| Claude | Architecture + code generation |

## Supabase Type Generation
```bash
# Generate TypeScript types from your Supabase schema
supabase gen types typescript --project-id YOUR_PROJECT_ID > database.types.ts
```

## Key Package Commands

### Angular
```bash
npm install @supabase/supabase-js
npm install -D tailwindcss postcss autoprefixer
ng add @angular/ssr
```

### Flutter
```bash
flutter pub add supabase_flutter
flutter pub add riverpod flutter_riverpod
flutter pub add go_router
flutter pub add geolocator
flutter pub add cached_network_image
flutter pub add flutter_local_notifications
flutter pub add flutter_dotenv
```
