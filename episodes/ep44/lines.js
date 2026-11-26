// EP44: receita caseira #8 - compressa fria x compressa quente
export const LINES = [
  { id: 'L01', text: 'Torceu o pé ou está com cólica? Compressa fria e compressa quente parecem iguais, mas servem para coisas bem diferentes.', emph: { torceu: 'orange', colica: 'orange', fria: 'blue', quente: 'red', diferentes: 'gold' }, pause: 0.45 },
  { id: 'L02', text: 'Para a fria, você precisa de gelo, um saco plástico e um pano limpo. Para a quente, um pano úmido morno ou uma bolsa térmica.', emph: { gelo: 'blue', saco: 'blue', pano: 'gold', fria: 'blue', quente: 'red', morno: 'orange', bolsa: 'orange' }, pause: 0.45 },
  { id: 'L03', text: 'A fria é para pancada, torção e inchaço recente, nas primeiras horas.', emph: { fria: 'blue', pancada: 'orange', torcao: 'orange', inchaco: 'orange', horas: 'gold' }, pause: 0.4 },
  { id: 'L04', text: 'Ponha o gelo no saco, enrole no pano e aplique por quinze a vinte minutos. Nunca o gelo direto na pele!', emph: { gelo: 'blue', enrole: 'gold', quinze: 'orange', vinte: 'orange', minutos: 'orange', nunca: 'red', pele: 'red' }, pause: 0.4 },
  { id: 'L05', text: 'Depois, faça uma pausa e repita mais tarde, se precisar.', emph: { pausa: 'green', repita: 'green' }, pause: 0.4 },
  { id: 'L06', text: 'Já a quente é para cólica, dor muscular e rigidez, quando não há inchaço novo.', emph: { quente: 'red', colica: 'orange', muscular: 'orange', rigidez: 'orange', inchaco: 'red' }, pause: 0.4 },
  { id: 'L07', text: 'Molhe o pano em água morna, torça bem e aplique por quinze a vinte minutos. Tem que ficar confortável, nunca arder.', emph: { morna: 'orange', torca: 'gold', quinze: 'orange', vinte: 'orange', minutos: 'orange', confortavel: 'green', arder: 'red' }, pause: 0.4 },
  { id: 'L08', text: 'Regra rápida: pancada, frio. Dor de músculo ou cólica, calor.', emph: { pancada: 'orange', frio: 'blue', musculo: 'orange', colica: 'orange', calor: 'red' }, pause: 0.4 },
  { id: 'L09', text: 'Cuidado: quem tem diabetes, má circulação ou pouca sensibilidade na pele deve evitar sem orientação. E nunca aplique sobre ferida aberta.', emph: { cuidado: 'red', diabetes: 'red', circulacao: 'red', sensibilidade: 'red', ferida: 'red' }, pause: 0.45 },
  { id: 'L10', text: 'Dor muito forte, pé deformado ou que não apoia, ou febre: procure um médico. Esta dica não substitui consulta.', emph: { forte: 'red', deformado: 'red', apoia: 'red', febre: 'red', medico: 'red' }, pause: 0.45 },
  { id: 'L11', text: 'Quiz: você torceu o pé agora há pouco. Qual compressa usar? A, quente. B, fria. C, nenhuma. É a B: fria!', emph: { quiz: 'gold', fria: 'green' }, pause: 0.5 },
  { id: 'L12', text: 'Resumindo: pancada, frio por até vinte minutos. Cólica e dor muscular, calor morno. Salva esse vídeo e segue o perfil!', emph: { salva: 'gold', segue: 'gold' }, pause: 0.45 },
  { id: 'L13', text: 'E você, usa compressa fria ou quente? Comenta aí!', emph: { fria: 'blue', quente: 'red', comenta: 'gold' }, pause: 0.3 },
];
