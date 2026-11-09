/* Banco de dados da turma (Supabase).
   Com os dois campos vazios, o site funciona só em cada aparelho e a turma vê
   o arquivo dados/projeto.json. Com eles preenchidos, todos veem as alterações
   em tempo real.
   A chave abaixo é pública por natureza: ela só permite ler o projeto.
   Para alterar é preciso o código da turma, que não fica em nenhum arquivo. */
window.CONFIG_NUVEM = {
  url: '',
  chave: ''
};
