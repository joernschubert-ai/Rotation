/** Provider schema constrains syntax only. Existing source/content checks remain authoritative. */
export const CONTEXT_RESPONSE_FORMAT={type:'json_schema' as const,json_schema:{name:'rotation_context_sections_v3',strict:true as const,schema:{
 type:'object',additionalProperties:false,required:['version','instruments'],properties:{
  version:{type:'string',enum:['CONTEXT_SECTIONS_V2']},
  instruments:{type:'array',minItems:3,maxItems:3,items:{type:'object',additionalProperties:false,
   required:['instrument','arguments','pricePnf','cot','history','synthesis','changeConditionId'],properties:{
    instrument:{type:'string',enum:['NASDAQ_PUT','NASDAQ_CALL','RUSSELL_CALL']},
    arguments:{type:'array',items:{type:'object',additionalProperties:false,required:['side','sourceId'],properties:{side:{type:'string',enum:['SUPPORTS','OPPOSES']},sourceId:{type:'string'}}}},
    pricePnf:{type:'string',minLength:40,maxLength:260},cot:{type:'string',minLength:40,maxLength:300},
    history:{type:'string',minLength:40,maxLength:260},synthesis:{type:'string',minLength:40,maxLength:300},
    changeConditionId:{type:['string','null']},
   }},
  },
 },
}}};

