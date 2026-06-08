#!/usr/bin/env node
/* eslint-disable */

/**
 * Generate Antora-compatible Devicon fa-devicon-* mappings from devicon.min.css
 * This script extracts icon content values from the official Devicon CSS and
 * creates a mapping file for Antora's fa- prefix requirement.
 */

const fs = require('fs');
const path = require('path');

// Common icons to include in the mapping (covers most use cases)
const ICON_LIST = [
  // Programming Languages
  'python', 'javascript', 'typescript', 'java', 'go', 'rust', 'ruby', 'php', 'csharp', 'cplusplus', 'c',
  'kotlin', 'swift', 'objective-c', 'perl', 'scala', 'r', 'fortran', 'haskell', 'lua',
  // Frontend Frameworks
  'react', 'vuejs', 'angular', 'nextjs', 'nuxt', 'svelte', 'ember', 'backbone', 'knockout',
  // Backend & Infrastructure
  'docker', 'kubernetes', 'terraform', 'nodejs', 'nginx', 'apache', 'mysql', 'postgresql', 'mongodb', 'redis',
  // Databases
  'sqlite', 'mariadb', 'neo4j', 'couchdb', 'cassandra', 'elasticsearch', 'dynamodb', 'firebase',
  // DevOps & Tools
  'github', 'gitlab', 'bitbucket', 'jenkins', 'git', 'gitlab', 'circleci', 'travis', 'ansible', 'vagrant',
  'docker', 'prometheus', 'grafana', 'kibana', 'logstash', 'datadog', 'newrelic', 'sentry',
  // Cloud Providers
  'aws', 'azure', 'googlecloud', 'digitalocean', 'heroku', 'netlify', 'vercel',
  // IDEs & Editors
  'vscode', 'intellij', 'pycharm', 'phpstorm', 'webstorm', 'clion', 'rider', 'vim', 'neovim', 'emacs', 'sublime',
  // CI/CD
  'circleci', 'gitlab', 'github', 'jenkins', 'travis',
  // OS
  'linux', 'ubuntu', 'debian', 'centos', 'fedora', 'redhat', 'windows', 'macos', 'apple',
  // Web Technologies
  'html5', 'css3', 'bootstrap', 'tailwindcss', 'sass', 'less', 'webpack', 'gulp', 'grunt',
  // Frameworks & Libraries
  'django', 'flask', 'laravel', 'spring', 'spring-boot', 'express', 'fastapi',
  // Additional commonly used
  'slack', 'jira', 'confluence', 'trello', 'asana', 'notion', 'discord', 'twitter', 'facebook', 'linkedin',
  'grafana', 'prometheus', 'logstash', 'elasticsearch', 'kibana', 'splunk', 'datadog',
  'kubernetes', 'helm', 'rancher', 'argo', 'gitops',
  'terraform', 'packer', 'vagrant', 'ansible', 'salt', 'puppet', 'chef',
  'prometheus', 'grafana', 'alertmanager', 'thanos',
  'kafka', 'rabbitmq', 'nats', 'mqtt',
  'ssl', 'oauth', 'okta', 'auth0',
  'graphql', 'grpc', 'rest', 'soap',
  'golang', 'rust', 'zig', 'nim', 'crystal', 'elixir', 'erlang', 'clojure', 'fsharp',
  'bazel', 'cmake', 'make', 'ninja', 'scons',
  'tmux', 'zsh', 'bash', 'powershell',
  'git', 'mercurial', 'svn', 'perforce',
  'npm', 'yarn', 'pnpm', 'pip', 'pipenv', 'poetry', 'cargo', 'gems',
  'docker', 'podman', 'buildah', 'skopeo',
  'minikube', 'kind', 'k3s', 'k3os',
  'istio', 'linkerd', 'consul',
  'mongodb', 'postgresql', 'mysql', 'mariadb', 'sqlite', 'oracle', 'mssql', 'redis', 'memcached',
  'elasticsearch', 'solr', 'meilisearch', 'algolia',
];

// Plain text variants to look for
const VARIANTS = ['-plain', '-original', '-line'];

async function generateMappings() {
  // Read the official devicon.min.css
  try {
    // Parse the regex pattern to extract devicon classes and their content
    // Pattern: .devicon-name-variant:before{content:"unicodechar"}
    const cssContent = require('fs').readFileSync(path.join(__dirname, '../node_modules/devicons/dist/devicons.css'), 'utf8');

    const mappings = {};

    // Parse all devicon classes
    const regex = /\.devicon-([\w-]+):before\{content:"([^"]+)"/g;
    let match;

    while ((match = regex.exec(cssContent)) !== null) {
      const iconName = match[1];
      const content = match[2];
      mappings[iconName] = content;
    }

    // Generate fa-devicon-* mappings
    let output = `/* Devicons 2.17.0 icon content mapping for fa-devicon-* classes */
/* Auto-generated from devicon.min.css */
/* Maps fa-devicon-* classes (Antora-compatible) to their Unicode content values */

/* Base styling for fa-devicon- prefixed classes */
.icon i[class*="fa-devicon-"] {
  font-family: 'devicon';
  font-weight: normal;
  font-style: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  speak: never;
}

`;

    // Add mappings for our icon list
    for (const baseIcon of ICON_LIST) {
      for (const variant of VARIANTS) {
        const fullIconName = baseIcon + variant;
        if (mappings[fullIconName]) {
          const simpleName = baseIcon.replace(/(-plain|-original|-line)$/, '');
          output += `.icon i.fa-devicon-${simpleName}::before {
  content: "${mappings[fullIconName]}";
}

`;
          break; // Only use the first available variant
        }
      }
    }

    // Write output
    const outputPath = path.join(__dirname, '../src/css/devicons-mapping.css');
    fs.writeFileSync(outputPath, output, 'utf8');
    console.log(`✓ Generated ${outputPath}`);
    console.log(`✓ Created mappings for ${Object.keys(mappings).length} total icons`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

generateMappings().catch(console.error);
