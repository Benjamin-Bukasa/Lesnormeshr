import React from 'react';

const LETTER_CLASS = 'A-Za-zÀ-ÖØ-öø-ÿŒœÆæ';
const ELISION_PREFIX_PATTERN = /\b(qu|[cdjlmnst]) (?=[aeiouyhàâäéèêëîïôöùûüœæ])/giu;
const COMMON_REPLACEMENTS = [
  [/\baujourd hui\b/giu, 'aujourd’hui'],
  [/\bquelqu un\b/giu, 'quelqu’un'],
  [/\bd abord\b/giu, 'd’abord'],
];
const WORD_REPLACEMENTS = [
  ['employes', 'employés'],
  ['employe', 'employé'],
  ['creer', 'créer'],
  ['cree', 'créé'],
  ['creee', 'créée'],
  ['taches', 'tâches'],
  ['tache', 'tâche'],
  ['criteres', 'critères'],
  ['critere', 'critère'],
  ['etapes', 'étapes'],
  ['etape', 'étape'],
  ['conges', 'congés'],
  ['conge', 'congé'],
  ['delais', 'délais'],
  ['delai', 'délai'],
  ['acces', 'accès'],
  ['mise a jour', 'mise à jour'],
  ['donnees', 'données'],
  ['donnee', 'donnée'],
  ['selectionner', 'sélectionner'],
  ['selectionnee', 'sélectionnée'],
  ['selectionne', 'sélectionne'],
  ['selection', 'sélection'],
  ['deconnecter', 'déconnecter'],
  ['televersement', 'téléversement'],
  ['irreversible', 'irréversible'],
  ['planifie', 'planifié'],
  ['terminee', 'terminée'],
];

function preserveCase(source, replacement) {
  if (source === source.toUpperCase()) {
    return replacement.toUpperCase();
  }

  if (source.charAt(0) === source.charAt(0).toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }

  return replacement;
}

export function formatFrenchTypography(value) {
  if (typeof value !== 'string') {
    return value;
  }

  let nextValue = value
    .replace(/\r\n/g, '\n')
    .replace(new RegExp(`([${LETTER_CLASS}])'(?=[${LETTER_CLASS}])`, 'gu'), '$1’')
    .replace(ELISION_PREFIX_PATTERN, '$1’')
    .replace(/\s*([;:?!])/g, '\u202F$1')
    .replace(/\s+,/g, ',')
    .replace(/\s+\./g, '.')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/ {2,}/g, ' ');

  for (const [pattern, replacement] of COMMON_REPLACEMENTS) {
    nextValue = nextValue.replace(pattern, replacement);
  }

  for (const [source, target] of WORD_REPLACEMENTS) {
    nextValue = nextValue.replace(
      new RegExp(`\\b${source}\\b`, 'giu'),
      (match) => preserveCase(match, target),
    );
  }

  return nextValue;
}

export function formatFrenchNode(node) {
  if (typeof node === 'string') {
    return formatFrenchTypography(node);
  }

  if (Array.isArray(node)) {
    return node.map((child, index) => {
      const formattedChild = formatFrenchNode(child);
      return React.isValidElement(formattedChild)
        ? React.cloneElement(formattedChild, { key: formattedChild.key ?? index })
        : formattedChild;
    });
  }

  if (React.isValidElement(node) && node.props?.children !== undefined) {
    return React.cloneElement(
      node,
      undefined,
      formatFrenchNode(node.props.children),
    );
  }

  return node;
}

export default formatFrenchTypography;
