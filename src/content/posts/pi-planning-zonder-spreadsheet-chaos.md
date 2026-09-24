---
title: "PI-planning zonder spreadsheet-chaos"
description: "Hoe je de voorbereiding van een PI-planning in Jira houdt in plaats van in twaalf losse Excel-bestanden."
date: 2026-09-18
topic: agile
type: artikel
lang: nl
draft: true
---

Elke PI-planning begint hetzelfde. Iemand exporteert de backlog naar Excel, iemand anders maakt er een kopie van, en twee weken later weet niemand meer welke versie klopt. Het werk staat in Jira, maar de gesprekken erover gebeuren ergens anders.

Dat hoeft niet. Met een paar afspraken en de functies die Jira al heeft, blijft de voorbereiding op één plek.

## Eén bron voor de backlog

Begin met één filter dat precies laat zien wat er in de komende PI zou kunnen landen. Niet meer en niet minder. Elk team werkt vanuit dezelfde lijst, en elke wijziging is meteen voor iedereen zichtbaar.

```jql
project = PI
AND fixVersion = "PI 26.4"
AND issuetype in (Feature, Epic)
AND status != Done
ORDER BY Rank ASC
```

Zet dit filter op een gedeeld dashboard en gebruik het als startpunt voor elke voorbereidingssessie. Wie iets wil toevoegen, doet dat in Jira, niet in een bijlage.

> Tip: Geef het filter een vaste naam met het PI-nummer erin. Dan vind je het volgend kwartaal meteen terug, en kun je achteraf vergelijken wat er gepland was en wat er echt geleverd is.

## Capaciteit zonder rekenblad

Capaciteit is het tweede excuus om toch weer een spreadsheet te openen. Houd het simpel:

- Leg per team de beschikbare dagen per iteratie vast, niet per persoon.
- Kies één eenheid voor schattingen en houd je daaraan.
- Laat afwijkingen zien in plaats van ze weg te rekenen.

## Afhankelijkheden zichtbaar maken

Een afhankelijkheid die alleen in iemands hoofd bestaat, is een risico. Leg ze vast als issue-links, dan kun je ze op het programmabord laten zien en tijdens de planning bespreken in plaats van erachteraan.
