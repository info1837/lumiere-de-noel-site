import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
register('./next-alias.mjs', pathToFileURL(import.meta.filename));
