# Tradução da aula em Libras

O servidor lê `end_of_turn` dos eventos `Turn` do AssemblyAI v3. Resultados
parciais atualizam as legendas e são agrupados em trechos de até 300 ms
de espera antes de entrar na fila. Falas concluídas liberam imediatamente o
restante do texto. Prefixos já enviados não são repetidos. A
segunda versão formatada do mesmo `turn_order` não repete a tradução. Falas
iguais em turnos diferentes continuam sendo traduzidas.

O VAD envia PCM silencioso durante as pausas, mantendo a linha do tempo para o
AssemblyAI detectar o fim da fala. Referência:
https://www.assemblyai.com/docs/streaming/message-sequence


A saudação “Olá! Bem-vindo ao DualLibras.AI.” é reproduzida uma vez por página
carregada. O envio começa quando a função `plugin.translate` está disponível.
Não depende de `isWelcomeFinished`, pois essa flag pode ficar falsa após uma
interrupção da animação nativa do widget.

A fila agrupa palavras em trechos em português para o VLibras traduzir com contexto. O
próprio player sequencia os sinais de cada frase. Fragmentos que aguardam na
fila são agrupados em pedidos de até 24 palavras (um fragmento maior permanece
inteiro), reduzindo chamadas ao tradutor sem descartar conteúdo. Os 300 ms são
apenas a espera interna de agrupamento: o atraso total também inclui a
transcrição, a rede e a duração dos sinais. Se a fala for mais rápida que a
sinalização, ainda haverá acúmulo de atraso. A próxima frase espera o
estado real `playing` → `idle` da API atual `window.vlibras`; no player legado,
espera `animation:play` seguido de `animation:end`. Resolver a requisição de
tradução não significa terminar a animação. Se o player não confirmar o término
em 120 segundos (descontando pausas do usuário), a fila mostra erro e aguarda
recarregamento, preservando as falas ainda não concluídas. Não avança por tempo
estimado. Os destaques das palavras na legenda continuam sendo aproximados,
e são suspensos quando a legenda ao vivo já pertence a outra fala.

## Verificação

- Em `client`: `npm run build` e `node --test tests/libras-*.test.mjs`.
- Em `server/ai`: `python3 -m unittest discover -s tests -v`.
- Com os serviços ativos, abrir `/aula` ou uma aula do professor. Esperar a
  saudação e conferir que ela não repete durante o silêncio.
- Ativar o microfone usando AssemblyAI, falar duas frases com uma pausa entre
  elas e conferir que a legenda acompanha a fala e o avatar conclui a primeira
  antes de iniciar a segunda. Repetir uma frase em outro turno deve traduzi-la.
- Simular falha do player e usar “recarregar”: as falas ainda pendentes devem
  permanecer na fila. A frase interrompida pode ser reiniciada.

Os testes automatizados usam estados/eventos simulados do player e mensagens
representativas do AssemblyAI. Não substituem a validação visual com microfone,
WebGL e os serviços externos funcionando no navegador.

Na verificação de navegador desta correção, a página `/aula` recebeu duas
mensagens simuladas de transcrição, com o VLibras oficial carregado de verdade.
O player reproduziu a saudação, “Bom dia turma.” e “Hoje vamos estudar
matemática.” em sequência e retornou a `idle` após a última frase, sem erros de
JavaScript. Esse teste cobre o caminho mensagem → fila → player real; a captura
do microfone e a conexão real ao AssemblyAI não fizeram parte desse teste.

## Velocidade de leitura

O padrão da aula é 1×. O seletor oferece 1×, 1,25×, 1,5× e 2×; o valor escolhido
é compartilhado entre a interface e o componente do avatar e reaplicado nas
próximas traduções. A API atual `window.vlibras.setSpeed` tem prioridade; as APIs
legadas são alternativas, sem enviar o mesmo comando a todas elas.

A verificação com o player oficial confirmou início em 1×, seleção de 1,25×
preservada ao passar de “Bom dia.” para “Obrigado.” e retorno a 1× durante a
reprodução, sem erros de JavaScript. Isso valida o controle de velocidade,
não a qualidade linguística dos sinais ou a latência de uma aula completa.
