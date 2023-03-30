import * as handlebars from 'handlebars';
import { type Field } from '../types';
import { registerHandlerbarHelpers } from './helpers';

registerHandlerbarHelpers(handlebars);
handlebars.registerHelper('field_default_value', function (field: Field) {
  if (field.defaultValue === undefined) return 'undefined';
  if (field.type.name === 'string') {
    return `"${field.defaultValue}"`;
  } else if (field.defaultValue === 'type.now()') {
    return 'new Date()'; // TODO: do a performant way of assigning time.
  } else if (field.defaultValue === 'type.autoincrement()') {
    return 'this.sequencer.next()'; // TODO: assign value per destination ?
  } else {
    return `${field.defaultValue.toString()}`;
  }
});

handlebars.registerPartial(
  'interface',
  `interface {{name}} {
    {{#each typeFields}}
    {{name}}{{#if isOptional}}?{{/if}}: {{type.name}};
    {{/each}}
}

`
);

handlebars.registerPartial(
  'event_interface',
  `/**
 {{> ts_documentation}}
 */
export interface {{name}} {
    {{#each fields}}
    /**
     {{> ts_documentation}}
     */
    {{name}}{{#if isOptional}}?{{/if}}: {{type.name}};
    {{/each}}
}

const {{name}}Zod = z.object({
    {{#each fields}}
    {{name}}: {{type.zodType}},
    {{/each}}
});

`
);

export const LOG_VALIDATE_METHODS_TEMPLATE = `

  isValid{{capitalName}}(event: {{name}}): boolean {
    const result = {{name}}Zod.safeParse(event)
    if (!result.success && this.config.verbose) {
      console.warn("{{name}} is not valid. errors: ", (result as any).error.toString())
    }
    return result.success
  }

  /**
   {{> ts_documentation}}
   * @param event object with fields defined in the syft model file. 
   */
  {{lowerName}}(event{{#if isOptionalInput}}?{{/if}}: {{name}}): boolean {
    const evt = event ?? {}
    {{#each fields}}
    {{#if defaultValue}}

    if (evt.{{name}} === undefined) {
      evt.{{name}} = {{field_default_value this}}
    }
    {{/if}}
    {{/each}}

    const syft = { eventName: "{{name}}", eventType: SyftEventType.{{eventType}}, isValid: true }    
    if (!this.isValid{{capitalName}}(evt)) {
      if (this.config.strict) {
        return false
      }
      syft.isValid = false
    }
    return this.batcher.logEvent({...evt, syft})
}

`;

export const GENERATED_TS_TEMPLATE = `
import type { StaticConfig, RuntimeConfig, SyftEvent, SyftPlugin } from './types'
import { SyftEventType } from './types'
import BaseSyft from './base'
import { z } from 'zod'


{{#each interface_defs}}
{{> interface this}}
{{/each}}

{{#each schemas}}
{{> event_interface this}}
{{/each}}

export default class Syft extends BaseSyft {    
  private static readonly staticConfig: StaticConfig = {{syftConfig}};

  constructor(config: RuntimeConfig) {
    super(Syft.staticConfig, config);
    console.debug('Syft is running via generated library!');
  }

  resetUser(): void {
    this.batcher.resetUser();
  }

  {{logMethods}}
}
`;
