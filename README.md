# passa lá? · app

App Android do [passa lá?](https://github.com/passa-la/site): quais ônibus passam perto de onde você vai,
os horários previstos em cada parada e as linhas diretas entre dois lugares, na Região Metropolitana do Recife.

Sem servidor: a rede inteira (linhas, paradas, trajetos e as 90 mil viagens com horário) vai dentro do app,
e toda conta roda no celular. Linhas, horários e favoritas funcionam sem internet.

## Como funciona

1. O gerador (`tools/gtfs`) lê o [GTFS do Grande Recife](https://www.granderecife.pe.gov.br/gtfs/gtfs.zip)
   com as mesmas regras do site: só ônibus com serviço ativo, o trajeto mais usado de cada sentido e tipo de
   dia, e todas as viagens agrupadas por sequência de paradas, com o horário em cada parada.
2. Tudo vira um arquivo binário compacto (`assets/net.bin.gz`, uns 2,3 MB) com as linhas e paradas num
   cabeçalho JSON e o resto em arrays (`src/data/codec.ts`).
3. No celular, `src/data/net.ts` carrega o arquivo na memória e responde as consultas que no site são SQL com
   PostGIS: paradas num raio, sentidos do dia, horários numa parada e linhas diretas.
4. As regras ficam em `src/domain` (sem React nem Expo) e os casos de uso em `src/cases`, portados do site e
   testados com as mesmas fixtures.

## Rodando

Precisa de Node 26 e pnpm.

```sh
pnpm install
pnpm data          # baixa o GTFS e gera assets/net.bin.gz
pnpm test          # Vitest
pnpm check         # TypeScript
pnpm start         # Metro
```

`pnpm data -- --zip arquivo.zip` usa um GTFS já baixado.

## Estrutura

```
src/app/       telas (expo-router)
src/domain/    geo e transporte: Point, Line, Way, Plan, Direct, Timetable…
src/cases/     Search, Show, Trip, Find
src/data/      formato do arquivo e a rede em memória
src/ui/        tema e componentes
tools/gtfs/    gerador: GTFS → net.bin.gz
tests/         Vitest e fixtures de GTFS
```

## Créditos

Linhas: Grande Recife Consórcio de Transporte.
