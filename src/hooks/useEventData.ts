import { useState, useEffect } from 'react';
import { parseReportCSV, parseEventosNovaCSV } from '../utils/csvParser';
import { CONSOLIDATED_EVENTS } from '../data/consolidated_events';
import type { ProcessedEvent } from '../types/Analytics';

// Sample data placeholders need to be accessible here, or duplicatable. 
// Ideally exported from a constant file, but for now reproducing or moving them is best.
// I will keep them here to avoid breaking Dashboard imports if I move them, 
// OR I can export them from Dashboard if I don't want to duplicate? No, better to duplicate or move to constants file.
// Let's duplicate for safety and decoupling.

const PLACEHOLDER_REPORT = `SETEMBRO,,,,,,,,,,,,
PARQUE PISTA | 26/09/2025,,,,,,,,,,,,
Data,Dia da Semana,Número de Vendas,Faturado,%,,,,CONTROLE ACESSOS 26.09,,,,
19/09/2025,sexta-feira,1,"R$ 54,00","0,17%",,,,LISTA,QNTD,VALIDADOS,,
22/09/2025,segunda-feira,13,"R$ 660,00","2,07%",,,,Total de Convidados,2278,498,,
23/09/2025,terça-feira,10,"R$ 420,00","1,32%",,,,Lista Amiga,1355,130,,
24/09/2025,quarta-feira,22,"R$ 1.105,00","3,47%",,,,Lista Amiga,1355,130,,
25/09/2025,quinta-feira,23,"R$ 1.269,00","3,99%",,,,VIP | Parceiros,362,223,,
26/09/2025,sexta-feira,100,"R$ 6.735,00","21,17%",,,,VIP | Parceiros,362,223,,
27/09/2025,sábado,28,"R$ 2.574,00","8,09%",,,,VIP AMIGO,336,59,,
Porta,,601,"R$ 19.004,00","59,72%",,,,VIP AMIGO,336,59,,
Cortesias,,378,,,,,,,,,,
Total de Vendas,,798,"R$ 31.821,00","100,00%",,,,Outros,225,86,,
,,,,,,,,,,,,
,,,,,,,,,,,,
OUTUBRO,,,,,,,,,,,,
PARQUE PISTA | 03/10/2025,,,,,,,,,,,,
Data,Dia da Semana,Número de Vendas,Real ( ),%,,,,,CONTROLE ACESSOS 03.10,,,
25/09/2025,quinta-feira,3,"R$ 108,00","0,84%",,,,,LISTA,QNTD,VALIDADOS,
28/09/2025,domingo,1,"R$ 36,00","0,28%",,,,,Total de Convidados,1434,349,
29/09/2025,segunda-feira,3,"R$ 126,00","0,98%",,,,,,,,
30/09/2025,terça-feira,28,"R$ 1.242,00","9,69%",,,,,Lista Amiga,674,105,
01/10/2025,quarta-feira,23,"R$ 1.175,00","9,17%",,,,,,,,
02/10/2025,quinta-feira,8,"R$ 385,00","3,00%",,,,,VIP | Parceiros,116,65,
03/10/2025,sexta-feira,63,"R$ 3.826,00","29,85%",,,,,,,,
04/10/2025,sábado,6,"R$ 522,00","4,07%",,,,,VIP AMIGO,71,15,
Porta,,408,"R$ 8.631,00","67,34%",,,,,,,,
Cortesias,,292,,,,,,,Outros,573,164,
Tudo,,700,"R$ 16.051,00",100%%,,,,,,,,
,,,,,,,,,,,,
,,,,,,,,,,,,
,,,,,,,,,,,,
PARQUE PISTA | 10/10/2025,,,,,,,,,,,,
Data,Dia da Semana,Número de Vendas,Faturado,%,,,,,CONTROLE ACESSOS 10.10,,,
25/09/2025,Quinta-feira,3,"R$ 126,00","0,52%",,,,,LISTA,QNTD,VALIDADOS,
27/09/2025,Sábado,1,"R$ 54,00","0,22%",,,,,Total de Convidados,1994,441,
28/09/2025,Domingo,9,"R$ 414,00","1,72%",,,,,,,,
29/09/2025,Segunda-feira,1,"R$ 54,00","0,22%",,,,,Lista Amiga,1431,114,
30/09/2025,Terça-feira,2,"R$ 108,00","0,45%",,,,,,,,
01/10/2025,Quarta-feira,4,"R$ 180,00","0,75%",,,,,VIP | Parceiros,275,178,
02/01/2025,Quinta-feira,1,"R$ 36,00","0,15%",,,,,,,,
04/10/2025,Sábado,1,"R$ 54,00","0,22%",,,,,VIP AMIGO,89,30,
05/10/2025,Domingo,3,"R$ 144,00","0,60%",,,,,,,,
06/10/2025,Segunda-feira,22,"R$ 1.084,00","4,50%",,,,,Outros,199,119,
07/10/2025,Terça-feira,24,"R$ 1.251,00","5,19%",,,,,,,,
08/10/2025,Quarta-feira,23,"R$ 1.197,00","4,97%",,,,,,,,
09/10/2025,Quinta-feira,18,"R$ 1.049,00","4,36%",,,,,,,,
10/10/2025,Sexta-feira,78,"R$ 5.421,00","22,51%",,,,,,,,
11/10/2025,Sábado,12,"R$ 1.035,00","4,30%",,,,,,,,
Porta,,504,"R$ 11.880,00","49,32%",,,,,,,,
Cortesias,,154,,"0,00%",,,,,,,,
Total de Vendas,,860,"R$ 24.087,00","100,00%",,,,,,,,
,,,,,,,,,,,,
,,,,,,,,,,,,
,,,,,,,,,,,,
PARQUE PISTA | 17/10/2025,,,,,,,,,,,,
Data,Dia da Semana,Qtd,Faturamento,%,,,,,CONTROLE ACESSOS 17.10,,,
01/10/2025,Quarta-feira,1,"R$ 40,00","0,19%",,,,,LISTA,QNTD,VALIDADOS,
04/10/2025,Sábado,2,"R$ 72,00","0,35%",,,,,Total de Convidados,2278,498,
06/10/2025,Segunda-feira,1,"R$ 60,00","0,29%",,,,,,,,
07/10/2025,Terça-feira,1,"R$ 54,00","0,26%",,,,,Lista Amiga,1355,130,
08/10/2025,Quarta-feira,1,"R$ 54,00","0,26%",,,,,,,,
13/10/2025,Segunda-feira,15,"R$ 690,00","3,31%",,,,,VIP | Parceiros,362,223,
14/10/2025,Terça-feira,4,"R$ 198,00","0,95%",,,,,,,,
15/10/2025,Quarta-feira,11,"R$ 564,00","2,71%",,,,,VIP AMIGO,336,59,
16/10/2025,Quinta-feira,20,"R$ 1.098,00","5,27%",,,,,,,,
17/10/2025,Sexta-feira,67,"R$ 4.243,00","20,38%",,,,,,,,
18/10/2025,Sábado,6,514,"2,47%",,,,,,,,
Porta,,532,"R$ 13.231,00","63,56%",,,,,,,,
Cortesias,,154,,"0,00%",,,,,,,,
Total de Vendas,,815,"R$ 20.818,00","100,00%",,,,,Outros,225,86,
,,,,,,,,,,,,
,,,,,,,,,,,,
,,,,,,,,,,,,
,,,,,,,,,,,,
,,,,,,,,,,,,
PARQUE PISTA | 24/10/2025,,,,,,,,,,,,
Data,Dia da Semana,Qtd,Faturamento,%,,,,,CONTROLE ACESSOS 24.10,,,
06/10/2025,Segunda-feira,1,"R$ 36,00","0,18%",,,,,LISTA,QNTD,VALIDADOS,
07/10/2025,Terça-feira,3,"R$ 144,00","0,70%",,,,,Total de Convidados,1412,450,
09/10/2025,Quinta-feira,1,"R$ 36,00","0,18%",,,,,,,,
10/10/2025,Sexta-feira,1,"R$ 36,00","0,18%",,,,,Lista Amiga,773,137,
13/10/2025,Segunda-feira,2,"R$ 90,00","0,44%",,,,,,,,
20/10/2025,Segunda-feira,4,"R$ 198,00","0,96%",,,,,VIP | Parceiros,148,91,
21/10/2025,Terça-feira,12,"R$ 576,00","2,80%",,,,,,,,
22/10/2025,Quarta-feira,24,"R$ 1.068,00","5,20%",,,,,VIP AMIGO,235,100,
23/10/2025,Quinta-feira,40,"R$ 2.339,00","11,38%",,,,,,,,
24/10/2025,Sexta-feira,64,"R$ 3.908,00","19,02%",,,,,Outros,256,122,
25/10/2025,Sábado,3,"R$ 306,00","1,49%",,,,,,,,
Porta,,203,"R$ 11.815,00","57,49%",,,,,,,,
Cortesias,,426,,"0,00%",,,,,,,,
Total de Vendas,,784,"R$ 20.552,00","100,00%",,,,,,,,
,,,,,,,,,,,,
,,,,,,,,,,,,
,,,,,,,,,,,,
,,,,,,,,,,,,
,,,,,,,,,,,,
PARQUE PISTA | 31/10/2025,,,,,,,,,,,,
Data,Dia da Semana,Qtd,Faturamento,%,,,,,CONTROLE ACESSOS 31.10,,,
21/10/2025,Terça-feira,1,"R$ 54,00","0,20%",,,,,LISTA,QNTD,VALIDADOS,
23/10/2025,Quinta-feira,9,"R$ 412,00","1,51%",,,,,Total de Convidados,1361,464,
27/10/2025,Segunda-feira,8,"R$ 306,00","1,12%",,,,,,,,
28/10/2025,Terça-feira,10,"R$ 492,00","1,80%",,,,,Lista Amiga,837,178,
29/10/2025,Quarta-feira,13,"R$ 693,00","2,54%",,,,,,,,
30/10/2025,Quinta-feira,13,"R$ 687,00","2,52%",,,,,VIP | Parceiros,189,116,
31/10/2025,Sexta-feira,82,"R$ 5.709,00","20,92%",,,,,,,,
01/11/2025,Sábado,22,"R$ 2.106,00","7,72%",,,,,,,,
Porta,,571,"R$ 16.832,00","61,68%",,,,,VIP AMIGO,55,36,
Cortesias,,369,,"0,00%",,,,,,,,
Total de Vendas,,1.098,"R$ 27.291,00","100,00%",,,,,Outros,2442,794,
,,,,,,,,,,,,
NOVEMBRO,,,,,,,,,,,,
PARQUE MIDAS ROOM | 07/11/2025,,,,,,,,,,,,
Data,Dia da Semana,Qtd,Faturamento,%,,,,,CONTROLE ACESSOS 07.11,,,
27/10/2025,Segunda-feira,5,"R$ 180,00","0,34%","R$ 36,00",,,,LISTA,QNTD,VALIDADOS,
28/10/2025,Terça-feira,8,"R$ 342,00","0,64%","R$ 42,75",,,,Total de Convidados,2244,504,
29/10/2025,Quarta-feira,25,"R$ 1.062,00","1,98%","R$ 42,48",,,,,,,"22,46%"
30/10/2025,Quinta-feira,6,"R$ 306,00","0,57%","R$ 51,00",,,,Lista Amiga,1759,290,
31/10/2025,Sexta-feira,3,"R$ 150,00","0,28%","R$ 50,00",,,,,,,
01/11/2025,Sábado,12,"R$ 576,00","1,07%","R$ 48,00",,,,VIP | Parceiros,9,3,
02/11/2025,Domingo,8,"R$ 405,00","0,76%","R$ 50,63",,,,,,,
03/11/2025,Segunda-feira,64,"R$ 3.438,00","6,41%","R$ 53,72",,,,VIP AMIGO,114,46,
04/11/2025,Terça-feira,28,"R$ 1.737,00","3,24%","R$ 62,04",,,,,,,
05/11/2025,Quarta-feira,26,"R$ 1.701,00","3,17%","R$ 65,42",,,,Outros,362,165,
06/11/2025,Quinta-feira,30,"R$ 2.124,00","3,96%","R$ 70,80",,,,,,,
07/11/2025,Sexta-feira,96,"R$ 8.939,00","16,66%","R$ 93,11",,,,,,,
08/11/2025,Sábado,10,"1.431,00","2,67%","143,1",,,,,,,
Porta,,304,"R$ 31.251,00","58,26%","R$ 102,80",,,,,,,
Cortesias,,346,,"0,00%",,,,,,,,
Total de Vendas,,971,"R$ 53.642,00","100,00%",,,,,,,,
,,,,,,,,,,,,
PARQUE BIKINI | 14/11/2025,,,,,,,,,,,,
,,,,,,,,,,,,
,,,,,,,,,,,,
Data,Dia da Semana,Qtd,Faturamento,%,,,,,CONTROLE ACESSOS 14.11,,,
27/10/2025,segunda-feira,1,"R$ 36,00","0,11%",,,,,LISTA,QNTD,VALIDADOS,
28/10/2025,terça-feira,1,"R$ 36,00","0,11%",,,,,Total de Convidados,1644,467,
04/11/2025,terça-feira,12,"R$ 540,00","1,69%",,,,,,,,"28,41%"
05/11/2025,quarta-feira,12,"R$ 486,00","1,52%",,,,,Lista Amiga,958,186,
06/11/2025,quinta-feira,11,"R$ 478,00","1,49%",,,,,,,,
07/11/2025,sexta-feira,3,"R$ 150,00","0,47%",,,,,VIP | Parceiros,258,108,
08/11/2025,sábado,9,"R$ 464,00","1,45%",,,,,,,,
09/11/2025,domingo,9,"R$ 530,00","1,65%",,,,,VIP AMIGO,51,18,
10/11/2025,segunda-feira,14,"R$ 714,00","2,23%",,,,,,,,
11/11/2025,terça-feira,20,"R$ 1.135,00","3,54%",,,,,Outros,377,155,
12/11/2025,quarta-feira,34,"R$ 2.017,00","6,29%",,,,,,,,
13/11/2025,quinta-feira,33,"R$ 1.967,00","6,14%",,346,,,,,,
14/11/2025,sexta-feira,527,"R$ 17.469,00","54,52%",,,,,,,,
15/11/2025,sábado,151,"R$ 6.020,00","18,79%",,,,,,,,
Porta,,491,"R$ 15.410,00","48,09%",,,,,,,,
Cortesias,,453,,"0,00%",,,,,,,,
Total de Vendas,,1.290,"R$ 32.042,00","100,00%",,,,,,,,
,,,,,,,,,,,,
,,,,,,,,,,,,
PARQUE ERRO 404 | 21/11/2025,,,,,,,,,,,,
,,,,,,,,,,,,
,,,,,,,,,,,,
Data,Dia da Semana,Qtd,Faturamento,%,,,,,CONTROLE ACESSOS 21.11,,,
04/11/2025,terça-feira,2,"R$ 90,00","0,14%",,,,,LISTA,QNTD,VALIDADOS,
06/11/2025,quinta-feira,9,"R$ 396,00","0,62%",,,,,Total de Convidados,3484,583,
07/11/2025,sexta-feira,8,"R$ 324,00","0,51%",,,,,,,,"16,73%"
08/11/2025,sábado,6,"R$ 216,00","0,34%",,,,,Lista Amiga,2728,333,
09/11/2025,domingo,7,"R$ 306,00","0,48%",,,,,,,,"12,21%"
10/11/2025,segunda-feira,5,"R$ 207,00","0,33%",,,,,VIP | Parceiros,187,71,
11/11/2025,terça-feira,7,"R$ 342,00","0,54%",,,,,,,,"37,97%"
12/11/2025,quarta-feira,10,"R$ 527,00","0,83%",,,,,VIP AMIGO,107,20,
13/11/2025,quinta-feira,8,"R$ 477,00","0,75%",,,,,,,,"18,69%"
14/11/2025,sexta-feira,4,"R$ 180,00","0,28%",,,,,Outros,462,159,
15/11/2025,sábado,10,"R$ 554,00","0,87%",,,,,,,,"34,42%"
16/11/2025,domingo,4,"R$ 241,00","0,38%",,,,,,,,
17/11/2025,segunda-feira,14,"R$ 755,00","1,19%",,,,,,,,
18/11/2025,terça-feira,27,"R$ 1.542,00","2,42%",,,,,,,,
19/11/2025,quarta-feira,40,"R$ 2.550,00","4,01%",,,,,,,,
20/11/2025,quinta-feira,44,"R$ 2.986,00","4,69%",,,,,,,,
21/11/2025,sexta-feira,686,"R$ 39.009,00","61,28%",,,,,,,,
22/11/2025,sábado,174,"R$ 12.950,00","20,35%",,,,,,,,
Porta,,632,"R$ 28.010,00","44,00%",,,,,,,,
Cortesias,,353,,,,433,,,,,,
Total de Vendas,,1.065,"R$ 63.652,00","100,00%",,,,,,,,
,,,,,,,,,,,,
,,,,,,,,,,,,
PARQUE EMBRAZA | 28/11/2025,,,,,,,,,,,,
,,,,,,,,,,,,
Data,Dia da Semana,Qtd,Faturamento,% do total,,,,,CONTROLE ACESSOS 21.11,,,
06/11/2025,quinta-feira,4,"R$ 198,00","0,34%",,,,,LISTA,QNTD,VALIDADOS,
10/11/2025,segunda-feira,20,"R$ 1.035,00","1,78%",,,,,Total de Convidados,1878,422,
11/11/2025,terça-feira,5,"R$ 255,00","0,44%",,,,,,,,"22,47%"
12/11/2025,quarta-feira,6,"R$ 304,00","0,52%",,,,,Lista Amiga,1452,215,
14/11/2025,sexta-feira,10,"R$ 543,00","0,93%",,,,,,,,
15/11/2025,sábado,5,"R$ 261,00","0,45%",,,,,VIP | Parceiros,104,67,
16/11/2025,domingo,4,"R$ 234,00","0,40%",,,,,,,,
17/11/2025,segunda-feira,3,"R$ 153,00","0,26%",,,,,VIP AMIGO,0,0,
18/11/2025,terça-feira,4,"R$ 241,00","0,41%",,,,,,,,
19/11/2025,quarta-feira,3,"R$ 171,00","0,29%",,,,,Outros,322,140,
20/11/2025,quinta-feira,1,"R$ 45,00","0,08%",,,,,,,,
21/11/2025,sexta-feira,5,"R$ 225,00","0,39%",,,,,,,,
23/11/2025,domingo,10,"R$ 468,00","0,80%",,,,,,,,
24/11/2025,segunda-feira,39,"R$ 2.106,00","3,62%",,,,,,,,
25/11/2025,terça-feira,65,"R$ 4.268,00","7,34%",,,,,,,,
26/11/2025,quarta-feira,48,"R$ 3.887,00","6,68%",,,,,,,,
27/11/2025,quinta-feira,46,"R$ 3.881,00","6,67%",,,278,,,,,
28/11/2025,sexta-feira (EVENTO),407,"R$ 21.592,00","37,11%",,,,,,,,
29/11/2025,sábado (pós),228,"R$ 18.315,00","31,48%",,,,,,,,
Porta,,635,"R$ 39.907,00","44,00%",,,,,,,,
Cortesias,,353,,,,,,,,,,
Total de Vendas,,909,"R$ 58.182,00","100,00%",,,,,,,,
DEZEMBRO,,,,,,,,,,,,
PARQUE SAIDEIRA| 05/12/2025,,,,,,,,,,,,
Data,Dia da semana,Qtd,Faturamento,%,,,,,,,,
26/11/2025,quarta-feira,4,"R$ 216,00","0,38%",,,,CONTROLE ACESSOS 07.11,,,,
27/11/2025,quinta-feira,7,"R$ 324,00","0,57%",,,,LISTA,QNTD,VALIDADOS,,
28/11/2025,sexta-feira,2,"R$ 108,00","0,19%",,,,Total de Convidados,2730,554,,
29/11/2025,sábado,1,"R$ 45,00","0,08%",,,,,,,"20,29%",
30/11/2025,domingo,1,"R$ 45,00","0,08%",,,,Lista Amiga,2181,300,,
01/12/2025,segunda-feira,26,"R$ 1.429,00","2,52%",,,,,,,,
02/12/2025,terça-feira,41,"R$ 2.337,00","4,12%",,,,VIP | Parceiros,69,37,,
03/12/2025,quarta-feira,26,"R$ 1.575,00","2,77%",,,,,,,,
04/12/2025,quinta-feira,69,"R$ 4.558,00","8,03%",,,,VIP AMIGO,106,54,,
05/12/2025,sexta-feira (EVENTO),381,"R$ 33.431,00","58,88%",,,,,,,,
06/12/2025,sábado (pós),106,"R$ 12.710,00","22,39%",,,,Outros,374,163,,
Porta,,487,"R$ 46.141,00","81,27%",,,,,,,,
Cortesias,,312,,"0,00%",,,,,,,,
Total de Vendas,,976,"R$ 56.778,00","100,00%",,,,,,,,
,,,,,,,177,,,,,
,,,,,,,,,,,,
,,,,,,,,,,,,
,,,,,,,,,,,,
,,,,,,,,,,,,
,,,,,,,,,,,,
PARQUE RUBY| 12/12/2025,,,,,,,,,,,,
Data,Dia da semana,Qtd,Faturamento ,%,,,,,,,,
04/12/2025,quinta-feira,10,"R$ 468,00","1,44%",,,,CONTROLE ACESSOS 07.11,,,,
05/12/2025,sexta-feira,7,"R$ 306,00","0,94%",,,,LISTA,QNTD,VALIDADOS,,
07/12/2025,domingo,8,"R$ 424,00","1,30%",,,,Total de Convidados,1564,384,,
08/12/2025,segunda-feira,10,"R$ 478,00","1,47%",,,,,,,"24,55%",
09/12/2025,terça-feira,32,"R$ 1.729,00","5,31%",,,,Lista Amiga,1159,184,,
10/12/2025,quarta-feira,34,"R$ 2.097,00","6,44%",,,,,,,,
11/12/2025,quinta-feira,24,"R$ 1.598,00","4,91%",,,,VIP | Parceiros,59,38,,
12/12/2025,sexta-feira,220,"R$ 18.150,00","55,73%",,,,,,,,
13/12/2025,sábado,65,"R$ 7.317,00","22,47%",,,,VIP AMIGO,31,14,,
Porta,,168,"R$ 15.290,00","46,95%",,,,,,,,
Cortesias,,323,,"0,00%",,,,Outros,315,148,,
Total de Vendas,,733,"R$ 32.567,00","100,00%",,,,,,,,`;

const PLACEHOLDER_EVENTS_NOVA = `Data,Evento,Local,Repasse Previsto,Repasse Real,RECEITA INGRESSE,RECEITA PORTA,TOTAL INGRESSOS,Custos Totais,Vips,TM de Porta,TM de Bar,RECEITA BAR,ROI
SUBTOTAL JANEIRO >>>>,,6,"R$ 13.300,00","R$ 10.519,79","R$ 209.640,00","R$ 132.470,00",4052,,,,,,
06/01/2025,Funk Room,Bosque Bar,"R$ 3.100,00","R$ 3.087,50","R$ 61.310,00","R$ 36.640,00",1179,,,"R$ 52,00",,,
11/01/2025,Verão RdJ,Ilha do Itanhangá,"R$ 1.000,00","R$ 1.267,29",-,-,-,,,,,,
13/01/2025,Funk Room,Bosque Bar,"R$ 1.200,00","R$ 1.550,00","R$ 38.880,00","R$ 32.180,00",841,,,"R$ 46,23",,,
20/01/2025,Funk Room,Bosque Bar,"R$ 3.000,00","R$ 2.681,50","R$ 57.600,00","R$ 31.270,00",1020,,,"R$ 56,47",,,
27/01/2025,Funk Room,Bosque Bar,,"R$ 1.933,50","R$ 51.850,00","R$ 32.380,00",1012,,,"R$ 51,24",,,
25/01/2025,Hype,Terrasse Rio,"R$ 5.000,00",-,,,,,,,,,
SUBTOTAL FEVEREIRO >>>>,,2,"R$ 0,00","R$ 2.342,00","R$ 29.790,00","R$ 17.050,00",619,"R$ 0,00",0,"R$ 0,00","R$ 0,00","R$ 0,00","0,00%"
03/02/2025,Funk Room,Bosque Bar,,"R$ 2.342,00","R$ 29.790,00","R$ 17.050,00",619,,,,,,
15/02/2025,The Fucking Party,BCo Space Makers,"R$ 0,00",-,-,-,-,,,,,,
SUBTOTAL MARÇO >>>>,,2,"R$ 9.000,00","R$ 11.705,03","R$ 8.125,00","R$ 0,00",248,"R$ 4.999,00",66,"R$ 44,64","R$ 0,00","R$ 0,00","0,00%"
22/03/2025,Midas Room,Alba,"R$ 5.000,00","R$ 3.069,75","R$ 8.125,00",,248,"R$ 4.999,00",66,"R$ 44,64",,,
28/03/2025,InCosta,Bosque Bar,"R$ 4.000,00","R$ 8.635,28",,,,,,,,,
SUBTOTAL ABRIL >>>>,,1,"R$ 0,00","R$ 0,00","R$ 0,00","R$ 0,00",0,"R$ 0,00",0,"R$ 0,00","R$ 0,00","R$ 0,00","0,00%"
19/04/2025,Funk Room,Sacadura 154,,,,,,,,,,,
SUBTOTAL MAIO >>>>,,4,"R$ 0,00","R$ 10.553,00","R$ 84.097,00","R$ 6.860,00",1354,"R$ 60.961,66",644,"R$ 198,20","R$ 0,00","R$ 0,00","0,00%"
02/05/2025,Kaya,Maguje,,"R$ 218,76","R$ 6.823,00","R$ 640,00",235,"R$ 6.000,00",115,"R$ 56,86",,,
16/05/2025,InCosta,Bosque Bar,,"R$ 7.943,00",,,,,,,,,
17/05/2025,Midas Room,Alba,,"R$ 223,42","R$ 11.171,00","R$ 1.280,00",245,"R$ 5.877,10",75,"R$ 65,71",,,
23/05/2025,Cherry On,EXC,,"R$ 2.167,82","R$ 66.103,00","R$ 4.940,00",874,"R$ 49.084,56",454,"75,63",,,
SUBTOTAL JUNHO >>>>,,2,"R$ 0,00","-R$ 4.482,83","R$ 35.173,49","R$ 5.850,00",1136,"R$ 48.167,51",520,"R$ 97,66","R$ 0,00","R$ 0,00","0,00%"
06/06/2025,Panela,Alba,,"R$ 558,74","R$ 4.713,00","R$ 770,00",170,"R$ 3.750,00",30,"R$ 33,66",,,
13/06/2025,Sweet,EXC,,"-R$ 5.041,57","R$ 30.460,49","R$ 5.080,00",966,"R$ 44.417,51",490,"R$ 63,99",,,
SUBTOTAL JULHO>>>>,,2,"R$ 0,00","R$ 625,00","R$ 7.954,16","R$ 600,00",392,"R$ 8.343,74",205,"R$ 83,73","R$ 0,00","R$ 0,00","0,00%"
05/07/2025,Sweet Rome,Embraza,,,"R$ 2.490,00","R$ 0,00",94,"R$ 3.855,00",5,"R$ 27,98",,,
25/07/2025,Kaya,Maguje,,"R$ 625,00","R$ 5.464,16","R$ 600,00",298,"R$ 4.488,74",200,"R$ 55,76",,,
SUBTOTAL AGOSTO>>>>,,4,"R$ 0,00","R$ 23.428,34","R$ 161.062,80","R$ 25.580,00",3052,"R$ 199.456,02",1117,"R$ 245,70","R$ 141,18","R$ 144.564,40","0,00%"
01/08/2025,Cherry On,EXC,,"R$ 9.851,24","R$ 62.424,00","R$ 5.420,00",1367,"R$ 68.084,00",524,"R$ 74,05","R$ 61,58","R$ 84.177,70",
09/08/2025,DiMarola,Vista Joá,,,"R$ 85.879,80","R$ 19.150,00",1426,"R$ 122.046,15",511,"R$ 93,86","R$ 30,34","R$ 43.259,70",
22/08/2025,Midas Room,Alba,,"R$ 5.488,10","R$ 12.759,00","R$ 1.010,00",259,"R$ 9.325,87",82,"R$ 77,79","R$ 49,26","R$ 17.127,00",
29/08/2025,InCosta,Bosque Bar,,"R$ 8.089,00",,,,,,,,,
SUBTOTAL SETEMBRO>>>>,,4,"R$ 0,00","R$ 5.881,93","R$ 21.606,00","R$ 16.210,00",1080,"R$ 12.517,36",558,"R$ 134,53","R$ 71,48","R$ 57.040,44","0,00%"
05/09/2025,Kaya,Maguje,,"R$ 1.752,84","R$ 4.975,00","R$ 1.020,00",282,"R$ 4.519,16",180,"R$ 58,77",,,
26/09/2025,Pista,Parque,,"R$ 4.129,09","R$ 16.631,00","R$ 15.190,00",798,"R$ 7.998,20",378,"R$ 75,76","R$ 71,48","R$ 57.040,44",
27/09/2025,Funk Room ,Sacadura 154,,,,,,,,,,,
SUBTOTAL OUTUBRO>>>>,,3,"R$ 0,00","-R$ 27.815,64","R$ 91.734,80","R$ 57.617,00",4038,"R$ 210.305,99",2097,"R$ 126,89","R$ 322,07","R$ 219.535,25","322,29%"
03/10/2025,Kaya,Maguje,,"R$ 72,67","R$ 3.471,00","R$ 620,00",187,"R$ 4.100,00",122,"R$ 62,94",,,
03/10/2025,Pista,Parque,,"R$ 2.854,85","R$ 7.360,00","R$ 8.691,00",543,"R$ 4.850,00",292,"R$ 63,95","R$ 45,42","R$ 24.665,10","58,86%"
10/10/2025,Pista,Parque,,"R$ 3.511,62","R$ 14.087,00","R$ 10.000,00",706,"R$ 8.149,50",360,"R$ 69,62","R$ 75,72","R$ 53.455,32","43,09%"
17/10/2025,Pista,Parque,,"R$ 4.686,45","R$ 7.587,00","R$ 13.231,00",669,"R$ 6.843,90",378,"R$ 71,54","R$ 70,47","R$ 46.580,03","68,48%"
24/10/2025,Pista,Parque,,"R$ 7.087,65","R$ 8.737,00","R$ 11.815,00",724,"R$ 7.869,30",426,"R$ 68,97","R$ 53,86","R$ 38.996,12","90,07%"
25/10/2025,DiMarola,BCo,,"-R$ 53.793,23","R$ 33.861,80","R$ 2.600,00",598,"R$ 170.180,29",150,"R$ 81,39",,,"-31,61%"
31/10/2025,Pista,Parque,,"R$ 7.764,35","R$ 16.631,00","R$ 10.660,00",611,"R$ 8.313,00",369,"R$ 75,81","R$ 76,60","R$ 55.838,68","93,40%"
SUBTOTAL NOVEMBRO>>>>,,7,"R$ 0,00","R$ 126.963,52","R$ 187.942,00","R$ 102.151,00",5443,"R$ 82.121,59",2071,"R$ 499,53","R$ 275,65","R$ 266.664,88","793,38%"
07/11/2025,Midas Room,Parque,,"R$ 24.984,22","R$ 22.391,00","R$ 31.561,00",971,"R$ 10.948,00",346,"R$ 86,32","R$ 71,73","R$ 69.650,41","228,20%"
14/11/2025,Bikini In Rio,Parque,,"R$ 13.723,02","R$ 19.297,00","R$ 15.410,00",837,"R$ 11.851,50",398,"R$ 74,94","R$ 50,12","R$ 45.905,44","11,79%"
19/11/2025,Cherry On,EXC,,"R$ 32.513,73","R$ 63.625,00","R$ 4.230,00",1158,"R$ 24.071,65",405,"R$ 90,11",,,
21/11/2025,Error 404,Parque,,"R$ 30.464,90","R$ 35.642,00","R$ 28.010,00",1065,"R$ 10.095,30",353,"R$ 89,40","R$ 69,23","R$ 73.731,02","301,77%"
28/11/2025,Embraza,Parque,,"R$ 17.148,77","R$ 35.242,00","R$ 22.940,00",915,"R$ 18.641,94",280,"R$ 91,78","R$ 84,57","R$ 77.378,01","126,81%"
29/11/2025,Kaya,Maguje,,"R$ 8.128,88","R$ 11.745,00","R$ 5.229,00",497,"R$ 6.513,20",289,"R$ 66,98",,,"124,81%"
SUBTOTAL DEZEMBRO>>>>,,4,"R$ 0,00","R$ 88.256,28","R$ 146.254,00","R$ 55.180,00",3635,"R$ 59.322,09",1327,"R$ 338,27","R$ 153,80","R$ 151.109,03","553,39%"
05/12/2025,Saideira,Parque,,"R$ 24.776,30","R$ 12.140,00","R$ 46.141,00",1036,"R$ 16.466,20",280,"R$ 91,78","R$ 84,57","R$ 77.378,01","150,47%"
12/12/2025,Ruby,Parque,,,,,,,,,,,
19/12/2025,DiMarola,Parque,,,,,,,,,,,
26/12/2025,Valeu Natalina,Parque,,,,,,,,,,,
06/12/2025,TRAVADO,,,,,,,,,,,,
13/12/2025,Midas Room,Barco,,,,,,,,,,,
27/12/2025,Funk Room,Privillege,,,,,,,,,,,`;

export function useEventData() {
    const [events, setEvents] = useState<ProcessedEvent[]>([]);

    useEffect(() => {
        const reportEvents = parseReportCSV(PLACEHOLDER_REPORT);
        const novaEvents = parseEventosNovaCSV(PLACEHOLDER_EVENTS_NOVA);

        const mergedEvents = [...reportEvents];

        // 1. Merge Consolidated Events (Data Source of Truth for tickets/coupons)
        CONSOLIDATED_EVENTS.forEach(consEvt => {
            const matchIndex = mergedEvents.findIndex(repEvt => {
                if (repEvt.date !== consEvt.date) return false;
                const normalize = (s: string) => s.toLowerCase().replace(/parque|\||\(|\)|-|\s/g, '');
                const n1 = normalize(repEvt.name);
                const n2 = normalize(consEvt.name);
                return n1 === n2 || n1.includes(n2) || n2.includes(n1);
            });

            if (matchIndex >= 0) {
                const existing = mergedEvents[matchIndex];
                mergedEvents[matchIndex] = {
                    ...existing,
                    coupons: consEvt.coupons,
                    // Use consolidated revenue/audience as it's granualar
                    totalRevenue: consEvt.totalRevenue || existing.totalRevenue,
                    totalAudience: consEvt.totalAudience || existing.totalAudience,
                    cortesias: consEvt.cortesias,
                    name: consEvt.name, // Use consolidated name format
                };
            } else {
                mergedEvents.push(consEvt);
            }
        });

        // 2. Merge Nova Events (Bar Data)
        novaEvents.forEach(novaEvt => {
            const matchIndex = mergedEvents.findIndex(repEvt => {
                if (repEvt.date !== novaEvt.date) return false;
                const normalize = (s: string) => s.toLowerCase().replace(/parque|\||\(|\)|-|\s/g, '');
                const n1 = normalize(repEvt.name);
                const n2 = normalize(novaEvt.name);
                return n1 === n2 || n1.includes(n2) || n2.includes(n1);
            });

            if (matchIndex >= 0) {
                const existing = mergedEvents[matchIndex];
                mergedEvents[matchIndex] = {
                    ...existing,
                    barRevenue: novaEvt.barRevenue || existing.barRevenue,
                    barTM: novaEvt.barTM || existing.barTM,
                };
            } else {
                mergedEvents.push(novaEvt);
            }
        });

        // Filter and Sort
        const finalEvents = mergedEvents.filter(e => (e.totalRevenue > 0 || (e.barRevenue || 0) > 0));
        finalEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setEvents(finalEvents);
    }, []);

    return { events };
}
