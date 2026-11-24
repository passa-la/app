# passa lá? · app

App Android do [passa lá?](https://github.com/passa-la/site): quais ônibus passam perto de onde você vai,
os horários previstos em cada parada e as linhas diretas entre dois lugares, na Região Metropolitana do Recife.

Sem servidor: a rede inteira (linhas, paradas, trajetos e as 90 mil viagens com horário) vai dentro do app,
e toda conta roda no celular. Linhas, horários e favoritas funcionam sem internet.

## Instalar

Baixe o APK em [releases/latest](https://github.com/passa-la/app/releases/latest/download/passa-la.apk) ou leia o
QR code com o celular. O Android pode pedir pra permitir a instalação de fontes desconhecidas.

<img src="docs/apk.png" alt="QR code do APK" width="180">

O app atualiza as linhas sozinho: uma vez por dia ele confere o release `data` e baixa a rede nova quando ela
muda. Versões novas do próprio app saem como releases `v*` e precisam ser instaladas por cima.

## Como funciona

1. O gerador (`tools/gtfs`) lê o [GTFS do Grande Recife](https://www.granderecife.pe.gov.br/gtfs/gtfs.zip)
   com as mesmas regras do site: só ônibus com serviço ativo, o trajeto mais usado de cada sentido e tipo de
   dia, e todas as viagens agrupadas por sequência de paradas, com o horário em cada parada.
2. Tudo vira um arquivo binário compacto (`assets/net.bin`, uns 8 MB, 2,3 MB comprimido no APK) com as
   linhas e paradas num cabeçalho JSON e o resto em arrays (`src/data/codec.ts`). O app leva o arquivo cru
   porque descomprimir em JavaScript no celular leva segundos; `dist/net.bin.gz` e `dist/net.json` são a
   versão comprimida pras atualizações.
3. No celular, `src/data/net.ts` carrega o arquivo na memória e responde as consultas que no site são SQL com
   PostGIS: paradas num raio, sentidos do dia, horários numa parada e linhas diretas.
4. As regras ficam em `src/domain` (sem React nem Expo) e os casos de uso em `src/cases`, portados do site e
   testados com as mesmas fixtures.

## Rodando

Precisa de Node 26 e pnpm.

```sh
pnpm install
pnpm data          # baixa o GTFS e gera assets/net.bin e dist/
pnpm test          # Vitest
pnpm check         # TypeScript
pnpm start         # Metro
```

`pnpm data -- --zip arquivo.zip` usa um GTFS já baixado.

O mapa usa o MapLibre nativo, que não roda no Expo Go: o app precisa de um build de desenvolvimento.

```sh
npx expo prebuild --platform android
cd android && ./gradlew app:assembleDebug -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/debug/app-debug.apk
npx expo start --dev-client --localhost   # com o celular no cabo: adb reverse tcp:8081 tcp:8081
```

Em máquina com pouca memória, limite o Gradle com `--max-workers=3`, `-Dorg.gradle.jvmargs=-Xmx3g` e
`-Pkotlin.compiler.execution.strategy=in-process`, e rode o build com `taskset -c 0-3`: a parte em C++ usa o
ninja, que dispara um compilador por núcleo (mais dois) e sem esse limite pode esgotar a memória.

## Publicação

| Action | Quando | O que faz |
| --- | --- | --- |
| `ci.yml` | cada push | testes e TypeScript |
| `data.yml` | toda segunda, 04:00 do Recife (ou na mão) | gera a rede e, se o feed mudou, publica `net.bin.gz` e `net.json` no release `data` |
| `release.yml` | tag `v*` | gera a rede, compila o APK assinado (arm64 e armv7) e publica o release |

A chave de assinatura fica nos secrets do repositório (`ANDROID_KEYSTORE`, `ANDROID_KEYSTORE_PASSWORD`,
`ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`). Sem ela não dá pra publicar uma atualização que instale por cima
da versão anterior, então guarde uma cópia fora do GitHub.

## Estrutura

```
src/app/       telas (expo-router)
src/domain/    geo e transporte: Point, Line, Way, Plan, Direct, Timetable…
src/cases/     Search, Show, Trip, Find
src/data/      formato do arquivo e a rede em memória
src/ui/        tema e componentes
tools/gtfs/    gerador: GTFS → net.bin
tests/         Vitest e fixtures de GTFS
```

## Créditos

Linhas: Grande Recife Consórcio de Transporte.
