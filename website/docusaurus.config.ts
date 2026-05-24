import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'work-summarizer',
  tagline: 'Turn git history into work summaries with AI',
  favicon: 'img/logo.svg',

  url: 'https://Vedant1202.github.io',
  baseUrl: '/work-summarizer/',

  organizationName: 'Vedant1202',
  projectName: 'work-summarizer',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/Vedant1202/work-summarizer/edit/main/website/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'work-summary',
      logo: {
        alt: 'work-summary logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'mainSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/Vedant1202/work-summarizer',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://www.npmjs.com/package/work-summarizer',
          label: 'npm',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction', to: '/docs/introduction' },
            { label: 'Installation', to: '/docs/installation' },
            { label: 'run', to: '/docs/commands/run' },
            { label: 'Configuration', to: '/docs/configuration/overview' },
          ],
        },
        {
          title: 'Integrations',
          items: [
            { label: 'Linear', to: '/docs/integrations/linear' },
            { label: 'Mintlify', to: '/docs/integrations/mintlify' },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/Vedant1202/work-summarizer',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/work-summarizer',
            },
            {
              label: 'Report an issue',
              href: 'https://github.com/Vedant1202/work-summarizer/issues',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Vedant Nandoskar. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript', 'diff'],
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
