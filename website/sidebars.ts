import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  mainSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: ['introduction', 'installation'],
    },
    {
      type: 'category',
      label: 'Commands',
      collapsed: false,
      items: [
        'commands/run',
        'commands/ui',
        'commands/docs',
        'commands/mintlify',
        'commands/config',
        'commands/doctor',
        'commands/history',
        'commands/export',
        'commands/schedule',
      ],
    },
    {
      type: 'category',
      label: 'Configuration',
      collapsed: false,
      items: [
        'configuration/overview',
        'configuration/env-variables',
        'configuration/config-files',
        'configuration/prompt-templates',
      ],
    },
    {
      type: 'category',
      label: 'Integrations',
      collapsed: false,
      items: ['integrations/linear', 'integrations/mintlify', 'integrations/custom-providers'],
    },
    'development',
  ],
};

export default sidebars;
