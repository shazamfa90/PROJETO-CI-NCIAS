# Projeto de Ciências

Site da turma para organizar o projeto de iniciação científica em microbiologia (3ª série do ensino médio). Funciona no celular e no computador, sem instalar nada.

## O que dá para fazer

| Página | Para que serve |
|---|---|
| Início | Pergunta de pesquisa, linha do tempo, próximas tarefas e pendências |
| Tarefas | Quem faz o quê e até quando, agrupado por etapa |
| Diário | Diário de bordo: um registro por sessão de trabalho |
| Resultados | Medidas de cada repetição, média, desvio padrão e gráfico de pontos |
| Projeto | Pergunta, hipótese, objetivo, metodologia e regras de segurança |
| Cronograma | Etapas do projeto com datas |
| Equipe | Colegas, funções e grupos |
| Materiais | Lista do que o experimento precisa e o que ainda falta |
| Referências | Livros, artigos e sites usados na pesquisa |
| Dados | Código da turma, cópia de segurança e situação da sincronização |

Na primeira vez, o site pede o tema que a turma votou (são os 11 temas da enquete) e monta um plano inicial com pergunta, hipótese, tratamentos, materiais, 6 etapas em 12 semanas e 16 tarefas. Tudo pode ser editado depois. Também há um projeto de exemplo para ver o site preenchido.

## Como colocar no ar (GitHub Pages)

1. No repositório, abra **Settings** e depois **Pages**.
2. Em **Source**, escolha **Deploy from a branch**.
3. Escolha o ramo que contém estes arquivos e a pasta **/ (root)**, e salve.
4. Em cerca de um minuto o endereço do site aparece no topo da mesma página.

Não há etapa de compilação: o site é HTML, CSS e JavaScript puros.

## Onde os dados ficam

O site funciona de dois jeitos, conforme o arquivo `js/config.js`.

### Com o banco da turma (tempo real)

Quando `js/config.js` tem o endereço e a chave pública de um projeto do Supabase:

- O projeto fica em um banco de dados. O que uma pessoa altera aparece para as outras em poucos segundos, sem recarregar.
- **Ver** é livre para quem tem o link. **Alterar** exige o código da turma, digitado uma vez em cada aparelho.
- Se duas pessoas alteram ao mesmo tempo, as duas alterações são mantidas. Se a internet cai, a alteração espera na tela e é enviada quando a conexão volta.
- O código da turma pode ser trocado na página **Dados**. Ele não fica em nenhum arquivo do repositório: o banco guarda só o hash.
- O banco guarda retratos automáticos das versões anteriores (um a cada 10 minutos de uso e sempre que o projeto é apagado).

A estrutura do banco está em `banco/esquema.sql`.

No plano gratuito, o Supabase pausa o projeto depois de uma semana sem nenhum acesso. Se o site mostrar "Sem conexão com o banco da turma" depois de férias, entre no painel do Supabase e retome o projeto.

### Sem banco (arquivo no repositório)

Com `js/config.js` vazio:

- O que cada pessoa altera fica salvo **no próprio aparelho**.
- A versão que **toda a turma vê** é o arquivo `dados/projeto.json`. Para publicar, baixe o arquivo na página **Dados e publicação** e envie para a pasta `dados` pelo GitHub (**Add file → Upload files**).

## Testar no computador

```bash
python3 -m http.server 8000
```

Depois abra `http://localhost:8000`. Abrir o `index.html` direto também funciona, mas sem a leitura da versão publicada.

## Estrutura

```
index.html          página única e ícones
css/estilo.css      visual, tema claro e escuro
js/modelos.js       modelos dos 11 temas e das etapas padrão
js/app.js           lógica do site
js/config.js        endereço e chave pública do banco da turma
js/vendor/          biblioteca do Supabase (usada só para o aviso em tempo real)
banco/esquema.sql   estrutura do banco no Supabase
dados/projeto.json  versão publicada para a turma
fontes/             fontes (hospedadas aqui, o site não depende de outros servidores)
licencas/           licenças das fontes e dos ícones
```

## Regras de design

O visual segue regras "anti-slop", para o site não ficar com cara de modelo genérico. As regras vieram de três skills públicas, usadas como referência durante a criação:

- [impeccable](https://github.com/pbakaus/impeccable) (Apache 2.0): piso de qualidade, modo de trabalho para telas de ferramenta e adaptação para celular.
- [anti-slop, da Gesso](https://github.com/Gesso-Build/skills) (MIT): lista de 73 sinais a evitar.
- [Visant skills](https://github.com/pedrojaques99/visant-skills-public) (MIT): cada elemento precisa servir a uma decisão de quem usa.

Na prática, ao editar o site, mantenha:

- Sem gradientes, sem texto em caixa alta, sem emoji no lugar de ícone, sem `transition: all`, sem travessão no texto da interface.
- Cores só com função: azul de metileno para ação, verde malaquita para feito, âmbar para em andamento, safranina para atraso. Estado nunca só pela cor, sempre com texto.
- Listas com linhas simples em vez de cartões; nada de cartão dentro de cartão.
- Áreas de toque de pelo menos 44 px, texto de pelo menos 12 px, campos com 16 px.
- Contraste de texto de pelo menos 4,5:1 nos dois temas.
- Um número zerado ou uma seção vazia não aparece no Início.

Para conferir automaticamente com o detector da Gesso (opcional, precisa de Node):

```bash
npx -y @gessobuild/anti-slop check .
```

## Créditos

- Fontes Atkinson Hyperlegible Next e Mono, do Braille Institute (SIL Open Font License 1.1).
- Ícones [Lucide](https://lucide.dev) (licença ISC).
- Biblioteca [supabase-js](https://github.com/supabase/supabase-js) (licença MIT).
