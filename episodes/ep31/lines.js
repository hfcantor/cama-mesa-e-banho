// EP31: bug do ano 2038 (o que vai acontecer)
export const LINES = [
  { id: 'L01', text: '19 de janeiro de 2038. Alguns computadores podem achar que voltamos para mil novecentos e um.', emph: { janeiro: 'gold', computadores: 'blue', voltamos: 'red' }, pause: 0.5 },
  { id: 'L02', text: 'Muitos sistemas contam o tempo em segundos, a partir de primeiro de janeiro de mil novecentos e setenta.', emph: { contam: 'gold', segundos: 'gold', setenta: 'gold' }, pause: 0.45 },
  { id: 'L03', text: 'Em sistemas antigos, esse número é guardado em trinta e dois bits.', emph: { antigos: 'orange', trinta: 'gold', bits: 'gold' }, pause: 0.45 },
  { id: 'L04', text: 'O maior número que cabe nesse formato corresponde a três horas, catorze minutos e sete segundos daquele dia, no horário universal.', emph: { maior: 'gold', tres: 'gold', catorze: 'gold', sete: 'gold' }, pause: 0.45 },
  { id: 'L05', text: 'Um segundo depois, o número estoura e vira negativo.', emph: { segundo: 'red', estoura: 'red', negativo: 'red' }, pause: 0.5 },
  { id: 'L06', text: 'Aí o computador pode entender isso como uma data lá em mil novecentos e um.', emph: { computador: 'blue', data: 'gold', um: 'gold' }, pause: 0.45 },
  { id: 'L07', text: 'É parecido com o bug do ano dois mil, mas por um motivo diferente.', emph: { bug: 'red', mil: 'gold', diferente: 'gold' }, pause: 0.45 },
  { id: 'L08', text: 'Muitos sistemas modernos já foram corrigidos.', emph: { modernos: 'green', corrigidos: 'green' }, pause: 0.5 },
  { id: 'L09', text: 'O maior risco está em equipamentos antigos ou embarcados, que quase nunca são atualizados.', emph: { risco: 'red', antigos: 'orange', embarcados: 'orange', atualizados: 'gold' }, pause: 0.45 },
  { id: 'L10', text: 'Por isso, programadores no mundo todo vêm trabalhando nisso há anos.', emph: { programadores: 'gold', anos: 'gold' }, pause: 0.45 },
  { id: 'L11', text: 'Se curtiu essa curiosidade, deixa o like e segue o perfil!', emph: { curtiu: 'red', like: 'red', segue: 'gold' }, pause: 0.45 },
  { id: 'L12', text: 'E você, já ouviu falar desse bug? Comenta aí!', emph: { bug: 'red', comenta: 'gold' }, pause: 0.3 },
];
