#!/usr/bin/env python3
"""Comprueba que un refactor solo ha movido código entre ficheros.

Uso:
    git show HEAD:ruta/original.tsx > /tmp/old.tsx
    python3 scripts/check-move.py /tmp/old.tsx ruta/nuevo_1.tsx ruta/nuevo_2.tsx ...

Compara las líneas no vacías del original con las de todos los ficheros nuevos
(sin importar el orden ni el fichero en que acaben). Imprime:
  - las líneas del original que faltan o han cambiado;
  - las líneas nuevas.
En un movimiento puro solo deben aparecer imports, `export` y cabeceras.
"""
import sys
from collections import Counter


def lines(path: str) -> list[str]:
    with open(path, encoding='utf-8') as f:
        return [line for line in f.read().split('\n') if line.strip()]


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    old = lines(sys.argv[1])
    new: list[str] = []
    for path in sys.argv[2:]:
        new += lines(path)
    missing = Counter(old) - Counter(new)
    added = Counter(new) - Counter(old)
    print('Líneas del original que faltan o cambiaron:')
    for line, n in missing.items():
        print(f'  x{n}: {line}')
    print('Líneas nuevas:')
    for line, n in added.items():
        print(f'  x{n}: {line}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
