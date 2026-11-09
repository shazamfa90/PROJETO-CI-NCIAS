/* Modelos de plano para cada tema votado pela turma.
   Cada tema preenche pergunta, hipótese, variável medida, tratamentos e materiais.
   Tudo pode ser editado depois dentro do site. */
(function () {
  'use strict';

  var SEGURANCA = {
    placas:
      'Use apenas microrganismos de risco 1 e trabalhe sempre com o orientador.\n' +
      'Depois de incubadas, as placas ficam lacradas com fita e não são reabertas.\n' +
      'Descarte as placas com água sanitária ou autoclave. Lave as mãos ao sair do laboratório.',
    ambiente:
      'Use luvas na coleta e lave as mãos depois.\n' +
      'Não abra recipientes com crescimento de fungos ou cheiro forte. Descarte fechado.\n' +
      'Identifique todos os recipientes com data, grupo e conteúdo.',
    alimentos:
      'As amostras do experimento não são para consumo.\n' +
      'Lave as mãos e os utensílios antes e depois de cada sessão.\n' +
      'Identifique todos os recipientes com data, grupo e conteúdo.'
  };

  var TEMAS = [
    {
      id: 'extratos',
      titulo: 'Ação antimicrobiana de extratos vegetais',
      requisito: 'Precisa de placas de Petri e estufa',
      pergunta: 'Extratos de alho, cravo e alecrim inibem o crescimento de Bacillus subtilis?',
      hipotese: 'Os três extratos formam halo de inibição maior que o controle com água, e o extrato de cravo forma o maior halo.',
      variavel: 'Halo de inibição', unidade: 'mm',
      tratamentos: ['Controle (água destilada)', 'Extrato de alho', 'Extrato de cravo', 'Extrato de alecrim'],
      materiais: ['Placas de Petri com ágar nutriente', 'Cultura de Bacillus subtilis', 'Discos de papel filtro', 'Alho, cravo e alecrim', 'Álcool 70%', 'Pinça', 'Régua ou paquímetro', 'Estufa ou caixa aquecida', 'Luvas e jaleco', 'Fita para lacrar as placas'],
      seguranca: SEGURANCA.placas
    },
    {
      id: 'maos',
      titulo: 'Eficácia dos métodos de higienização das mãos',
      requisito: 'Precisa de placas de Petri e estufa',
      pergunta: 'Qual método reduz mais os microrganismos das mãos: sabão comum, sabonete antibacteriano ou álcool 70%?',
      hipotese: 'Todos os métodos reduzem o número de colônias em relação à mão não lavada, e o álcool 70% reduz mais.',
      variavel: 'Colônias por placa', unidade: 'UFC',
      tratamentos: ['Sem lavar (controle)', 'Sabão comum', 'Sabonete antibacteriano', 'Álcool 70%'],
      materiais: ['Placas de Petri com ágar nutriente', 'Cotonetes estéreis', 'Sabão comum', 'Sabonete antibacteriano', 'Álcool 70%', 'Fita para lacrar as placas', 'Estufa ou caixa aquecida', 'Água sanitária para o descarte', 'Luvas e jaleco'],
      seguranca: SEGURANCA.placas
    },
    {
      id: 'superficies',
      titulo: 'Contaminação de superfícies da escola',
      requisito: 'Precisa de placas de Petri e estufa',
      pergunta: 'Quais superfícies da escola têm mais microrganismos, e a limpeza com álcool 70% reduz essa carga?',
      hipotese: 'Celulares e maçanetas têm mais colônias que as carteiras, e a limpeza com álcool 70% reduz as colônias em todas as superfícies.',
      variavel: 'Colônias por placa', unidade: 'UFC',
      tratamentos: ['Celular', 'Maçaneta', 'Bebedouro', 'Teclado do laboratório', 'Maçaneta após limpeza'],
      materiais: ['Placas de Petri com ágar nutriente', 'Cotonetes estéreis', 'Álcool 70%', 'Papel toalha', 'Fita para lacrar as placas', 'Estufa ou caixa aquecida', 'Água sanitária para o descarte', 'Luvas e jaleco'],
      seguranca: SEGURANCA.placas
    },
    {
      id: 'agua',
      titulo: 'Qualidade microbiológica da água',
      requisito: 'Precisa de kit de coliformes',
      pergunta: 'A água dos bebedouros da escola e de fontes do bairro tem coliformes?',
      hipotese: 'A água dos bebedouros não apresenta coliformes, e a água do córrego apresenta.',
      variavel: 'Coliformes totais', unidade: 'NMP/100 mL',
      tratamentos: ['Água mineral (controle)', 'Bebedouro do pátio', 'Bebedouro do corredor', 'Torneira da cantina', 'Córrego do bairro'],
      materiais: ['Kit de coliformes (Colilert ou similar)', 'Frascos estéreis de coleta', 'Caixa térmica com gelo', 'Etiquetas e caneta permanente', 'Estufa ou caixa aquecida', 'Luvas'],
      seguranca: SEGURANCA.ambiente
    },
    {
      id: 'conservantes',
      titulo: 'Conservantes naturais em alimentos',
      requisito: 'Material de cozinha',
      pergunta: 'Canela, vinagre e óleo de orégano retardam o aparecimento de fungos no pão?',
      hipotese: 'Os pães tratados demoram mais dias para apresentar fungos que o pão sem tratamento.',
      variavel: 'Dias até o primeiro fungo visível', unidade: 'dias',
      tratamentos: ['Sem tratamento (controle)', 'Canela em pó', 'Vinagre', 'Óleo de orégano'],
      materiais: ['Pão de forma sem conservantes', 'Sacos plásticos com fecho', 'Canela em pó', 'Vinagre', 'Óleo essencial de orégano', 'Borrifador', 'Etiquetas e caneta permanente', 'Luvas'],
      seguranca: SEGURANCA.ambiente
    },
    {
      id: 'leveduras',
      titulo: 'Fermentação por leveduras',
      requisito: 'Material de cozinha',
      pergunta: 'Como a temperatura afeta a produção de gás pela levedura Saccharomyces cerevisiae?',
      hipotese: 'A produção de gás é maior a 35 °C e menor a 5 °C e a 55 °C.',
      variavel: 'Volume de gás em 30 minutos', unidade: 'mL',
      tratamentos: ['5 °C (geladeira)', '20 °C (ambiente)', '35 °C (banho morno)', '55 °C (banho quente)'],
      materiais: ['Fermento biológico seco', 'Açúcar', 'Seringas de 60 mL ou garrafas PET de 500 mL', 'Balões', 'Termômetro', 'Recipientes para banho-maria', 'Proveta ou copo medidor', 'Cronômetro', 'Balança de cozinha'],
      seguranca: SEGURANCA.alimentos
    },
    {
      id: 'fermentados',
      titulo: 'Probióticos e alimentos fermentados',
      requisito: 'Material de cozinha e fitas de pH',
      pergunta: 'Como a temperatura de incubação afeta a acidez do iogurte caseiro?',
      hipotese: 'O iogurte incubado a 42 °C fica ácido mais rápido que o incubado em temperatura ambiente ou na geladeira.',
      variavel: 'pH após 8 horas', unidade: 'pH',
      tratamentos: ['Geladeira (5 °C)', 'Ambiente (25 °C)', 'Caixa térmica (42 °C)'],
      materiais: ['Leite integral', 'Iogurte natural (inóculo)', 'Fitas de pH ou pHmetro', 'Potes de vidro com tampa', 'Caixa térmica', 'Termômetro', 'Panela e colher'],
      seguranca: SEGURANCA.alimentos
    },
    {
      id: 'winogradsky',
      titulo: 'Coluna de Winogradsky',
      requisito: 'Garrafas PET e lama de lago ou córrego',
      pergunta: 'Como a luz afeta as camadas de microrganismos em uma coluna de Winogradsky?',
      hipotese: 'As colunas expostas à luz formam camadas coloridas que não aparecem nas colunas mantidas no escuro.',
      variavel: 'Camadas coloridas visíveis', unidade: 'camadas',
      tratamentos: ['Escuro (controle)', 'Luz natural', 'Luz artificial'],
      materiais: ['Garrafas PET transparentes', 'Lama de lago ou córrego', 'Água do mesmo local', 'Papel picado (fonte de carbono)', 'Gema de ovo cozida (fonte de enxofre)', 'Filme plástico', 'Papel alumínio', 'Régua', 'Luvas'],
      seguranca: SEGURANCA.ambiente
    },
    {
      id: 'solo',
      titulo: 'Microrganismos do solo e crescimento de plantas',
      requisito: 'Vasos, terra e sementes',
      pergunta: 'O inoculante de Rhizobium melhora o crescimento do feijão em comparação com solo comum e solo esterilizado?',
      hipotese: 'O feijão com inoculante cresce mais que o do solo comum, e o do solo esterilizado cresce menos.',
      variavel: 'Altura da planta em 21 dias', unidade: 'cm',
      tratamentos: ['Solo esterilizado', 'Solo comum (controle)', 'Solo com inoculante'],
      materiais: ['Sementes de feijão', 'Inoculante de Rhizobium', 'Terra de jardim', 'Vasos ou copos iguais', 'Forno para esterilizar o solo', 'Régua', 'Regador com medida', 'Etiquetas e caneta permanente'],
      seguranca: SEGURANCA.ambiente
    },
    {
      id: 'compostagem',
      titulo: 'Compostagem e decomposição',
      requisito: 'Baldes, restos vegetais e termômetro',
      pergunta: 'Como a proporção entre restos verdes e material seco afeta a temperatura da composteira?',
      hipotese: 'A mistura com partes iguais de restos verdes e material seco atinge a maior temperatura.',
      variavel: 'Temperatura máxima no interior', unidade: '°C',
      tratamentos: ['Só restos verdes', 'Metade verdes, metade secos', 'Só material seco'],
      materiais: ['Baldes ou caixas com tampa furada', 'Restos de frutas e verduras', 'Folhas secas ou serragem', 'Termômetro de haste', 'Balança', 'Pá pequena', 'Luvas'],
      seguranca: SEGURANCA.ambiente
    },
    {
      id: 'kombucha',
      titulo: 'Bioplástico de kombucha (celulose bacteriana)',
      requisito: 'Cultura de kombucha e balança de precisão',
      pergunta: 'A quantidade de açúcar no chá altera a massa da película de celulose produzida pela kombucha?',
      hipotese: 'O chá com 10% de açúcar produz película mais pesada que os chás com 5% e 2%.',
      variavel: 'Massa seca da película', unidade: 'g',
      tratamentos: ['2% de açúcar', '5% de açúcar', '10% de açúcar'],
      materiais: ['Cultura de kombucha com chá de arranque', 'Chá preto', 'Açúcar', 'Potes de vidro de boca larga', 'Pano e elástico para cobrir', 'Balança de precisão', 'Vinagre para a limpeza', 'Luvas'],
      seguranca: SEGURANCA.alimentos
    }
  ];

  /* Etapas padrão: 12 semanas no total. */
  var ETAPAS = [
    { nome: 'Planejamento e pesquisa', semanas: 2, tarefas: ['Definir a pergunta e a hipótese', 'Reunir pelo menos 5 referências', 'Dividir a turma em grupos e funções'] },
    { nome: 'Preparação dos materiais', semanas: 2, tarefas: ['Conseguir todos os materiais da lista', 'Combinar as regras de segurança com o orientador', 'Fazer um teste piloto'] },
    { nome: 'Experimento e coleta de dados', semanas: 4, tarefas: ['Realizar pelo menos 3 repetições por tratamento', 'Registrar cada sessão no diário de bordo', 'Fotografar cada etapa do experimento'] },
    { nome: 'Análise dos resultados', semanas: 2, tarefas: ['Digitar as medidas na página Resultados', 'Comparar as médias com a hipótese', 'Escrever a conclusão'] },
    { nome: 'Relatório e banner', semanas: 1, tarefas: ['Escrever o relatório', 'Montar o banner'] },
    { nome: 'Apresentação', semanas: 1, tarefas: ['Ensaiar a apresentação', 'Apresentar o projeto'] }
  ];

  window.MODELOS = { temas: TEMAS, etapas: ETAPAS };
})();
