import type { SupportedLanguage } from './types.js'

interface ParamDef {
  name: string
  type: string
}

interface FunctionDef {
  name: string
  params: ParamDef[]
  returnType: string
}

interface FunctionNameMap {
  [lang: string]: string
}


function cppDeserialize(varName: string, type: string): string[] {
  const lines: string[] = []
  if (type === 'int') {
    lines.push(`  int ${varName} = _j["${varName}"].get<int>();`)
  } else if (type === 'float') {
    lines.push(`  double ${varName} = _j["${varName}"].get<double>();`)
  } else if (type === 'bool') {
    lines.push(`  bool ${varName} = _j["${varName}"].get<bool>();`)
  } else if (type === 'string') {
    lines.push(`  string ${varName} = _j["${varName}"].get<string>();`)
  } else if (type === 'int[]') {
    lines.push(`  vector<int> ${varName} = _j["${varName}"].get<vector<int>>();`)
  } else if (type === 'float[]') {
    lines.push(`  vector<double> ${varName} = _j["${varName}"].get<vector<double>>();`)
  } else if (type === 'string[]') {
    lines.push(`  vector<string> ${varName} = _j["${varName}"].get<vector<string>>();`)
  } else if (type === 'int[][]') {
    lines.push(`  vector<vector<int>> ${varName} = _j["${varName}"].get<vector<vector<int>>>();`)
  } else {
    lines.push(`  auto ${varName} = _j["${varName}"];`)
  }
  return lines
}


export function wrapJavaScript(userCode: string, fnDef: FunctionDef, fnName: string): string {
  const paramNames = fnDef.params.map(p => p.name)
  return [
    userCode,
    '',
    `const _i = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));`,
    `const _r = ${fnName}(${paramNames.map(p => `_i[${JSON.stringify(p)}]`).join(', ')});`,
    `process.stdout.write(JSON.stringify(_r));`,
  ].join('\n')
}

export function wrapTypeScript(userCode: string, fnDef: FunctionDef, fnName: string): string {
  // ts-node handles TypeScript; same pattern as JS
  return wrapJavaScript(userCode, fnDef, fnName)
}

export function wrapPython(userCode: string, fnDef: FunctionDef, fnName: string): string {
  const params = fnDef.params.map(p => p.name)
  return [
    'import sys,json',
    userCode,
    `_i=json.loads(sys.stdin.read())`,
    `print(json.dumps(${fnName}(${params.map(p => `_i[${JSON.stringify(p)}]`).join(', ')})))`,
  ].join('\n')
}

export function wrapCpp(userCode: string, fnDef: FunctionDef, fnName: string): string {
  const lines: string[] = []
  lines.push('#include <iostream>')
  lines.push('#include <vector>')
  lines.push('#include <string>')
  lines.push('#include <nlohmann/json.hpp>')
  lines.push('using namespace std;')
  lines.push('using json = nlohmann::json;')
  lines.push('')
  lines.push(userCode)
  lines.push('')
  lines.push('int main() {')
  lines.push('  json _j;')
  lines.push('  cin >> _j;')

  const callArgs: string[] = []
  for (const param of fnDef.params) {
    lines.push(...cppDeserialize(param.name, param.type))
    callArgs.push(param.name)
  }

  lines.push(`  auto __result = ${fnName}(${callArgs.join(', ')});`)

  const retType = fnDef.returnType
  if (retType === 'bool') {
    lines.push('  cout << (__result ? "true" : "false") << endl;')
  } else if (retType === 'string') {
    lines.push('  cout << json(__result).dump() << endl;')
  } else if (retType.endsWith('[]') || retType.endsWith('[][]')) {
    lines.push('  cout << json(__result).dump() << endl;')
  } else {
    lines.push('  cout << __result << endl;')
  }

  lines.push('  return 0;')
  lines.push('}')
  return lines.join('\n')
}

export function wrapGo(userCode: string, fnDef: FunctionDef, fnName: string): string {
  const lines: string[] = []
  lines.push('package main')
  lines.push('')
  lines.push('import (')
  lines.push('\t"encoding/json"')
  lines.push('\t"fmt"')
  lines.push('\t"os"')
  lines.push(')')
  lines.push('')

  // Paste user code (should not include package main)
  lines.push(userCode)
  lines.push('')

  lines.push('func main() {')
  lines.push('\tvar _i map[string]interface{}')
  lines.push('\tjson.NewDecoder(os.Stdin).Decode(&_i)')

  const callArgs: string[] = []
  for (const param of fnDef.params) {
    const varName = `_p_${param.name}`
    if (param.type === 'int') {
      lines.push(`\t${varName} := int(_i[${JSON.stringify(param.name)}].(float64))`)
    } else if (param.type === 'float') {
      lines.push(`\t${varName} := _i[${JSON.stringify(param.name)}].(float64)`)
    } else if (param.type === 'bool') {
      lines.push(`\t${varName} := _i[${JSON.stringify(param.name)}].(bool)`)
    } else if (param.type === 'string') {
      lines.push(`\t${varName} := _i[${JSON.stringify(param.name)}].(string)`)
    } else if (param.type === 'int[]') {
      lines.push(`\t_raw_${param.name} := _i[${JSON.stringify(param.name)}].([]interface{})`)
      lines.push(`\t${varName} := make([]int, len(_raw_${param.name}))`)
      lines.push(`\tfor _k, _v := range _raw_${param.name} { ${varName}[_k] = int(_v.(float64)) }`)
    } else if (param.type === 'string[]') {
      lines.push(`\t_raw_${param.name} := _i[${JSON.stringify(param.name)}].([]interface{})`)
      lines.push(`\t${varName} := make([]string, len(_raw_${param.name}))`)
      lines.push(`\tfor _k, _v := range _raw_${param.name} { ${varName}[_k] = _v.(string) }`)
    } else if (param.type === 'int[][]') {
      lines.push(`\t_raw_${param.name} := _i[${JSON.stringify(param.name)}].([]interface{})`)
      lines.push(`\t${varName} := make([][]int, len(_raw_${param.name}))`)
      lines.push(`\tfor _k, _v := range _raw_${param.name} {`)
      lines.push(`\t\t_inner := _v.([]interface{})`)
      lines.push(`\t\t${varName}[_k] = make([]int, len(_inner))`)
      lines.push(`\t\tfor _m, _w := range _inner { ${varName}[_k][_m] = int(_w.(float64)) }`)
      lines.push(`\t}`)
    } else {
      lines.push(`\t${varName} := _i[${JSON.stringify(param.name)}]`)
    }
    callArgs.push(varName)
  }

  lines.push(`\t_result := ${fnName}(${callArgs.join(', ')})`)
  lines.push('\t_out, _ := json.Marshal(_result)')
  lines.push('\tfmt.Println(string(_out))')
  lines.push('}')
  return lines.join('\n')
}

export function buildWrappedCode(
  language: SupportedLanguage,
  userCode: string,
  fnDef: FunctionDef,
  functionNameMap: FunctionNameMap,
): string {
  const fnName = (functionNameMap[language] ?? functionNameMap['javascript'] ?? fnDef.name)

  switch (language) {
    case 'javascript': return wrapJavaScript(userCode, fnDef, fnName)
    case 'typescript': return wrapTypeScript(userCode, fnDef, fnName)
    case 'python':     return wrapPython(userCode, fnDef, fnName)
    case 'cpp':        return wrapCpp(userCode, fnDef, fnName)
    case 'go':         return wrapGo(userCode, fnDef, fnName)
  }
}
