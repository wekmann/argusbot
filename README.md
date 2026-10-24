# Argusbot

Chcę zbudować nowoczesną, profesjonalną stronę internetową i dashboard dla projektu bota Discord o nazwie "Argus" (Argus Studio). 

Strona ma być w pełni funkcjonalna, stworzona w Next.js / React przy użyciu Tailwind CSS, ze stylizacją w klimacie premium (dark mode / mroczny i elegancki styl).

### 1. KOLORYSTYKA I DESIGN
- **Główny motyw:** Ciemne tło (bardzo głęboki granat / ciemne odcienie z palety Slate/Zinc).
- **Akcenty:** Złoty / miodowy (Gold / Amber) jako elegancki kolor wyróżnień, 

dprzycisków i akcentów.
- **Styl:** Nowoczesny UI/UX, delikatne obramowania (subtelne border-slate-800), wyrazista typografia, zaokrąglone rogi (rounded-xl), efekt rozmycia w tle (glassmorphism / backdrop-blur).
- **Język interfejsu:** Angielski (z przygotowaniem pod łatwą polonizację w przyszłości).

### 2. STRUKTURA I STRONY (ROUTES)
A) **Landing Page (`/`)**:
   - **Hero Section:** Nagłówek "DISCORD MODERATION - ARGUS", opis bota, duży przycisk "Login with Discord" z integracją NextAuth (OAuth2).
   - **Status Dashboard:** Sekcja pokazująca status na żywo (Status: ONLINE, Bot Username, Liczba połączonych serwerów, Uptime) z przyciskiem "Refresh".
   - **Footer:** Linki do /privacy, /terms oraz informacja o prawach autorskich.

B) **Dashboard serwerów (`/servers` / `/dashboard`)**:
   - Lista serwerów, na których użytkownik ma uprawnienia administratorskie.
   - Po wygraniu serwera – przejście do zarządzania konkretnym serwerem (`/dashboard/[guildId]`).

C) **Generowanie Serwera AI (`/dashboard/[guildId]/aibuild`)**:
   - Interfejs do generowania struktury serwera za pomocą AI (Gemini).
   - Pole tekstowe (Prompt input) z limitem 500 znaków.
   - Przycisk "Generate Server Architecture".
   - Podgląd struktury JSON/wygenerowanych ról i kanałów.

D) **Logi i Statystyki (`/dashboard/[guildId]/logs`)**:
   - Widok historii akcji moderacyjnych.

E) **Strony Prawne (`/privacy` oraz `/terms`)**:
   - Gotowe szablony polityki prywatności i warunków korzystania z usługi, dynamicznie pobierające dane operatora ze zmiennych środowiskowych.

### 3. INTEGRACJA I UWIERZYTELNIANIE
- Logowanie przez **Discord OAuth2** (skupione na scope: `identify` oraz `guilds`).
- Ścieżka powrotna OAuth2 Callback: `/api/auth/callback/discord`.
- Poprawna obsługa błędów logowania (Error Handling dla błędu `discord`).

---

IMPORTANT INSTRUCTION FOR LOVABLE:
Przeprowadź mnie krok po kroku przez konfigurację. Zanim wygenerujesz końcowy kod, jeśli potrzebujesz konkretnych zmiennych środowiskowych (np. DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, NEXTAUTH_SECRET, NEXTAUTH_URL, BOT_API_SECRET, Gemini API Key lub domen), ZADAJ MI PYTANIA i poproś o podanie tych wartości, abym mógł je wkleić.

daje ci grafike i to jest logo wszystkie to tez ma byc favicona

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://argusbot.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bb6d9b84-ae8d-42d9-b4fa-ee285d550f2e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
