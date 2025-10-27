# Guia de Estilos do Projeto Encanto Rústico

Este documento descreve a arquitetura e as convenções de estilo do CSS para o projeto Encanto Rústico.

## Arquitetura do CSS

O CSS do projeto é organizado de forma modular para garantir escalabilidade e manutenibilidade. A estrutura de diretórios é a seguinte:

```
public/
└── css/
    ├── base/
    │   ├── reset.css
    │   └── typography.css
    ├── components/
    │   ├── button.css
    │   ├── card.css
    │   └── form.css
    ├── layout/
    │   ├── footer.css
    │   └── header.css
    ├── pages/
    │   ├── home.css
    │   └── ...
    ├── main.css
    ├── variables.css
    └── responsive.css
```

### `main.css`

Este é o arquivo principal que importa todos os outros arquivos CSS na ordem correta. A ordem de importação é crucial para o funcionamento correto dos estilos.

### `variables.css`

Este arquivo contém todas as variáveis CSS globais do projeto, como cores, fontes e espaçamentos.

### `base/`

Contém os estilos básicos do projeto.

- `reset.css`: Redefine os estilos padrão do navegador para garantir consistência.
- `typography.css`: Define os estilos de tipografia base para elementos como `h1`, `p`, `a`, etc.

### `components/`

Contém os estilos para componentes de UI reutilizáveis.

- `button.css`: Estilos para botões.
- `card.css`: Estilos para cards.
- `form.css`: Estilos para formulários.

### `layout/`

Contém os estilos para as principais seções de layout do site.

- `footer.css`: Estilos para o rodapé.
- `header.css`: Estilos para o cabeçalho e a barra de navegação.

### `pages/`

Contém os estilos específicos para cada página do site.

### `responsive.css`

Contém todos os media queries para garantir que o site seja responsivo em diferentes tamanhos de tela.

## Convenções

- **Nomenclatura:** Utilizamos a metodologia BEM (Block, Element, Modifier) para nomear as classes CSS.
- **Unidades:** Utilizamos `rem` para fontes e espaçamentos e `px` para bordas.
- **Variáveis:** Todas as cores, fontes e espaçamentos devem ser definidos como variáveis no arquivo `variables.css`.
