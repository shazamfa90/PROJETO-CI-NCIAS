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
| Dados e publicação | Baixar, abrir e publicar o arquivo do projeto |

Na primeira vez, o site pede o tema que a turma votou (são os 11 temas da enquete) e monta um plano inicial com pergunta, hipótese, tratamentos, materiais, 6 etapas em 12 semanas e 16 tarefas. Tudo pode ser editado depois. Também há um projeto de exemplo para ver o site preenchido.

## Como colocar no ar (GitHub Pages)

1. No repositório, abra **Settings** e depois **Pages**.
2. Em **Source**, escolha **Deploy from a branch**.
3. Escolha o ramo que contém estes arquivos e a pasta **/ (root)**, e salve.
4. Em cerca de um minuto o endereço do site aparece no topo da mesma página.

Não há etapa de compilação: o site é HTML, CSS e JavaScript puros.

## Onde os dados ficam

O site não tem servidor. Por isso:

- O que cada pessoa altera fica salvo **no próprio aparelho** (armazenamento do navegador).
- A versão que **toda a turma vê** é o arquivo `dados/projeto.json` deste repositório.

Para publicar uma nova versão para a turma:

1. No site, abra **Dados e publicação** e baixe o arquivo do projeto (`projeto.json`).
2. No GitHub, abra a pasta `dados`, use **Add file → Upload files** e envie o arquivo, substituindo o antigo.
3. Confirme em **Commit changes**.

Quem abrir o site depois disso recebe a versão publicada. Se a pessoa tiver alterações próprias ainda não publicadas, o site avisa e deixa escolher entre a versão publicada e a dela, sem apagar nada sozinho.

O ideal é que uma pessoa (o orientador ou o líder da turma) seja responsável por publicar.

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
