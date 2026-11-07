# Cherry Bolsas

Site da Cherry Bolsas em HTML, CSS e JavaScript, com catálogo, busca, favoritos, categorias animadas pela rolagem e bolsa com movimento de pêndulo.

## Abrir e editar

Abra a pasta do projeto no Antigravity, VS Code ou outro editor. Não é necessário instalar dependências nem executar um build.

Para visualizar localmente, execute na raiz do projeto:

```bash
python3 -m http.server 8080 --directory dist
```

Depois abra http://localhost:8080 no navegador. No Windows, também é possível usar `py -m http.server 8080 --directory dist`.

## Arquivos principais

- `dist/index.html`: estrutura e conteúdo das páginas.
- `dist/catalog.js`: dados dos cinco modelos de bolsas.
- `dist/app.js`: busca, filtros, favoritos e detalhes dos modelos.
- `dist/hero.js`: carrossel e interação com a bolsa na hero.
- `dist/hero-reference.css`: proporções do cabeçalho e da hero.
- `dist/hero-fibers.js`: partículas discretas no fundo da hero.
- `dist/categories-scroll.js`: trajetória das bolsas nas categorias, ligada à rolagem.
- `dist/category-navigation.js`: setas das categorias.
- `dist/spotlight-motion.js`: alinhamento da alça ao suporte e balanço da bolsa em destaque.
- `dist/sections-reference.css`: layout das categorias, grid e destaque.
- `dist/style.css`, `dist/hero.css`, `dist/sections.css`: estilos base.
- `dist/assets/`: imagens e identidade visual usadas no site.

Os cartões dos produtos estão em `dist/index.html`; os dados dos detalhes e filtros ficam em `dist/catalog.js`. Ao adicionar um modelo, atualize ambos e mantenha o mesmo identificador.

## Publicação

O conteúdo de `dist/` pode ser servido por uma hospedagem de arquivos estáticos.

A versão atual no Sites está em:
https://cherry-bolsas-atelier.niftygrackle.chatgpt.site

Este repositório guarda uma cópia do código. Alterações no GitHub não atualizam automaticamente a publicação do Sites. O arquivo `.openai/hosting.json` mantém a identificação do Site existente; ele não contém credenciais.

## Catálogo e atendimento

Valores, medidas e disponibilidade são consultados pelo Instagram da Cherry. Os favoritos ficam salvos apenas no navegador do visitante.

## Créditos

O efeito Ghost Fibers foi adaptado do React Bits, de David Haz. A licença e os avisos originais estão em `dist/THIRD-PARTY-NOTICES.txt`.
