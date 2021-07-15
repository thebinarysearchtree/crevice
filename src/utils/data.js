const reviver = (key, value, context) => {
  if (key.includes('_')) {
    const renamedKey = key.replace(/_[a-z]/g, (s) => s[1].toUpperCase());
    context[renamedKey] = value;
  }
  else {
    return value;
  }
}

const makeReviver = (parser) => {
  if (!parser) {
    return function(key, value) {
      return reviver(key, value, this);
    }
  }
  return function(key, value) {
    return reviver(key, parser(key, value), this);
  }
}

const wrapper = (sql) => {
  return `
    with wrap_result as (${sql}) 
    select cast(coalesce(json_agg(wrap_result), json_build_array()) as text) as result 
    from wrap_result`;
}

class Query {
  constructor(text = '', values = []) {
    this.text = text;
    this.values = values;
  }
}

const sqlTag = (strings, params, wrapper) => {
  let index = 1;
  const paramsLength = params.length;
  if (strings.every(s => s === '') && paramsLength === 1) {
    return new Query(`${params[0]}`, []);
  }
  const query = strings.reduce((a, c, i) => {
    if (paramsLength < (i + 1)) {
      a.text += c;
      return a;
    }
    const param = params[i];
    if (param instanceof Array) {
      if (param.length !== 0) {
        if (param[0] instanceof Query) {
          a.text += c;
          for (const query of param) {
            a.values = a.values.concat(query.values);
            const text = query.text.replace(/\$(\d+)/mg, (m, n) => `$${parseInt(n, 10) + (index - 1)}`);
            a.text += text;
            index += query.values.length;
          }
          return a;
        }
      }
      a.values = a.values.concat(param);
      const text = param.map((v, i) => `$${index + i}`).join(',');
      a.text += `${c}${text}`;
      index += param.length;
      return a;
    }
    if (param instanceof Query) {
      a.values = a.values.concat(param.values);
      const text = param.text.replace(/\$(\d+)/mg, (m, n) => `$${parseInt(n, 10) + (index - 1)}`);
      a.text += `${c}${text}`;
      index += param.values.length;
      return a;
    }
    a.values.push(param);
    a.text += `${c}$${index}`;
    index++;
    return a;
  }, new Query());
  if (wrapper) {
    query.text = wrapper(query.text);
  }
  return query;
}

const sql = (strings, ...params) => sqlTag(strings, params);
const wrap = (strings, ...params) => sqlTag(strings, params, wrapper);

export {
  sql,
  wrap,
  makeReviver
};
