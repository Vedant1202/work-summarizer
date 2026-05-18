import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'daily-work-summarizer',
  tagline: 'Turn git history into daily stand-up summaries with AI',
  favicon: 'img/logo.svg',

  url: 'https://Vedant1202.github.io',
  baseUrl: '/daily-work-summarizer/',

  organizationName: 'Vedant1202',
  projectName: 'daily-work-summarizer',
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
            'https://github.com/Vedant1202/daily-work-summarizer/edit/main/website/',
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
      title: 'daily-summary',
      logo: {
        alt: 'daily-summary logo',
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
          href: 'https://github.com/Vedant1202/daily-work-summarizer',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://www.npmjs.com/package/daily-work-summarizer',
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
              href: 'https://github.com/Vedant1202/daily-work-summarizer',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/daily-work-summarizer',
            },
            {
              label: 'Report an issue',
              href: 'https://github.com/Vedant1202/daily-work-summarizer/issues',
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
