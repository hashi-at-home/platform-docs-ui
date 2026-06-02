# Hashi@Home Antora UI

This repo contains a UI bundle for the Antora documentation framework.
It is inspired by the Antora default UI project, with several updates to make it compatible with NodeJS >= 20.
Several dependencies have been replaced compared to the original, and the build tasks have been reworked.

It is intended as a user interface to documentation for platform engineering:

- Documenting the platform itself
- Documenting activities in developing and delivering the platform
- Workload documentation
- Links to operational services (monitoring, _etc_)

## Development environment

The development environment is configured with [`mise`](https://mise.jdx.dev).
Assuming you already have `mise` installed, install the tools and activate the environment:

```
mise trust
mise install
eval "$(mise activate zsh)" # Assuming ZSH shell
npm install
```

You now have the development tools available:

```
node -v
v26.3.0

gulp --version
CLI version: 3.1.0
Local version: 5.0.1
```

## Building a bundle

In order to use the UI in a documentation project

## Features

This UI makes a few tweaks on the default UI, specifically selecting fonts and colours for components.

### Fonts

We chose the DM Sans and Monaspace families for fonts.

### Colours

The EGI Foundation design system is used as a colour schema.
