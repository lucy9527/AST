const Global_Scope = new Map()

class Type_{
    constructor(value){
        this.type = value
        return this
    }
}

class Term_Num extends Type_{
    constructor(value){
        super('const_num')
        this.value = value
        return this
    }
}

class Term_Str extends Type_{
    constructor(value){
        super('const_str')
        this.value = value
        return this
    }
}

class Term_Var extends Type_{
    constructor(_var){
        super('term_var')
        this.value = _var
        return this
    }
}

class Exp_GT extends Type_{
    constructor(left , right ){
        super('exp_gt')
        this.left  = left
        this.right = right 
        return this
    }
}

class Exp_LT extends Type_{
    constructor(left , right ){
        super('exp_lt')
        this.left  = left
        this.right = right 
        return this
    }
}

class Exp_NQ extends Type_{
    constructor(left , right ){
        super('exp_nq')
        this.left  = left
        this.right = right 
        return this
    }
}

class Exp_EQ extends Type_{
    constructor(left , right ){
        super('exp_eq')
        this.left  = left
        this.right = right 
        return this
    }
}

class Exp_ADD extends Type_{
    constructor(left , right ){
        super('exp_add')
        this.left  = left
        this.right = right 
        return this
    }
}

class Stm_Assign extends Type_{
    constructor(_var, expr ){
        super('stm_assign')
        this._var = _var
        this.expr = expr
        return this
    }
}

class Stm_While extends Type_ {
    constructor(conds , body){
        super('stm_while')
        this.conds = conds
        this.body = body
        return this
    }
}

class Stm_IF extends Type_ {
    constructor(conds , if_body , else_body){
        super('stm_if')
        this.conds = conds
        this.if_body = if_body
        this.else_body = else_body
        return this
    }
}

class Def_Function extends Type_ {
    constructor(name , params , excuts , ret ){
        super('def')
        this.name = name 
        this.params = params 
        this.excuts = excuts
        this.ret = ret
        return this
    }
}

class Excut_Def_Function extends Type_ {
    constructor(name , values ){
        super('excut_def')
        this.name = name 
        this.values = values 
        return this
    }
}


var fs = require('fs');
var file = fs.readFileSync('./target.txt', "utf8").toString();
file = file.replace(/\s+/g, ' ').trim()
//var_s = 's'; def hello() { num_a = 0; num_b = 1; return num_a + num_b; } 
var len = file.length , i = 0 ;

// console.log(file.match(/(def\s[a-z]+\)/g))

const NonTerminal = ['+' , '*']

const AST_W = []
var cur_file = file;

while(cur_file.length > 0 ){
    var len = 0
    if(cur_file.startsWith('def')){
        cur_file = deal_word(cur_file.slice(4) , 'def')
    }else if(cur_file.startsWith('if')){
        cur_file = deal_word(cur_file.slice(2) , 'if')
    }else if(cur_file.startsWith('while')){
        cur_file = deal_word(cur_file , 'while')
    }else{
        var loc = cur_file.indexOf(';');
        // console.log( cur_file.slice(0,loc).match(/\(\s*\)/) );
        if(cur_file.slice(0,loc).match(/\([^\(|\)]*\)/)){
            deal_word(cur_file , 'excut_def')
            cur_file = cur_file.slice(loc+1)
        }else{
            cur_file = deal_word(cur_file , 'expr')
        }
    }
}

// console.log(AST_W , 'AST_W');

function cons_str(args){
    return new Term_Str(args.trim())
}

function cons_num(args){
    return new Term_Num(args.trim())
}

function cons_var(args){
    return new Term_Var(args.trim())
}

function cons_expr(args=''){
    args = args.trim()
    if(args.indexOf('*') > -1){
        // console.log('*');
        var arr = args.split('*')
        return new Exp_MUl(cons_expr(arr[0]) , cons_expr(arr[1]))
    }else if(args.indexOf('+')>-1){
        // console.log('+');
        var arr = args.split('+')
        return new Exp_ADD(cons_expr(arr[0]) , cons_expr(arr[1]))
    }else if(args.startsWith("'") && args.endsWith("'")){
        // console.log('str',args);
        return cons_str(args)
    }else if(!isNaN(args)){
        return cons_num(args)
    }else{
        return cons_var(args)
    }
}

function cons_InEquality(inequal = ''){
    inequal = inequal.trim()
    if(inequal.indexOf('>') > -1){
        // console.log('>');
        var arr = inequal.split('>')
        return new Exp_GT( cons_expr(arr[0]) , cons_expr(arr[1]) )
    }else if(inequal.indexOf('<')>-1){
        // console.log('<');
        var arr = inequal.split('<')
        return new Exp_LT( cons_expr(arr[0]) , cons_expr(arr[1]) )
    }else if(inequal.indexOf('==')>-1){
        // console.log('==');
        var arr = inequal.split('==')
        return new Exp_EQ( cons_expr(arr[0]) , cons_expr(arr[1])) 
    }else if(inequal.indexOf('!=')>-1){
        // console.log('!=');
        var arr = inequal.split('!=')
        return new Exp_NQ( cons_expr(arr[0]) , cons_expr(arr[1])) 
    }
}


function cons_stmt_assign(args){
    var arr = args.split('=')
    return new Stm_Assign(cons_var(arr[0]) , cons_expr(arr[1]))
}


function cons_stmts(args){
    var arr = args.split(';').filter(item => item.trim().length).map(item => cons_stmt_assign(item))
    return arr;
} 


function cons_stmt_def(name , params , body ){    
    var [ excut , ret ] = body.split('return').map(item => item.trim())
    params = params.length ?  params.split(',').map(item => cons_var(item)) : []
    return new Def_Function(name , params , cons_stmts(excut) , cons_expr(ret.slice(0,-1)))
}

function cons_stmt_while(conds , body){
    conds = cons_InEquality(conds)
    // body = body.split(';').filter(item => item.length).map(item => cons_stmt_assign(item))
    return new Stm_While(conds , cons_stmts(body))
}

function cons_stmt_if(conds , if_body , else_body){
    conds = cons_InEquality(conds)
    return new Stm_IF(conds , cons_stmts(if_body) , cons_stmts(else_body))
}

function cons_stmt_excut_def(name , values ){    
    values = values.length ? values.split(',').map(item => isNaN(item) ?  cons_str(item) : cons_num(item)  ) : []
    return new Excut_Def_Function( name , values )
}

function deal_word(word , type){
    if(type === 'expr'){
        len = word.indexOf(';')
        AST_W.push( cons_stmt_assign(word.slice(0 , len)) )
        return word.slice(len+1).trim()
    }else{
        var name_e = word.indexOf('(')+1
        var props_e = word.indexOf(')')
        var body_s = word.indexOf('{')+1
        var body_e = word.indexOf('}')
        var next_part = body_e
        switch(type){
            case 'def':{
                AST_W.push(cons_stmt_def(word.slice(0,name_e-1) , word.slice(name_e ,props_e), word.slice(body_s,body_e)))
                break;
            }
            case 'while':{
                AST_W.push(cons_stmt_while(word.slice(name_e,props_e), word.slice(body_s+1,body_e)))
                break;
            }
            case 'if':{
                var else_temp = word.slice(body_e+1)
                var else_s = else_temp.indexOf("{")+1 , else_e = else_temp.indexOf("}");
                AST_W.push(cons_stmt_if(word.slice(name_e,props_e), word.slice(body_s+1,body_e) , else_temp.slice(else_s , else_e)))
                return else_temp.slice(else_e+1)
            }
            case 'excut_def':{
                AST_W.push(cons_stmt_excut_def(word.slice(0,name_e-1), word.slice( name_e , props_e )  ) )
                return 
            }
            default:
                break;
        }
        return word.slice(next_part + 1).trim()
    }
}
console.log('###############################################');

PARSE_AST(AST_W)


function PARSE_AST(ast_lex){
    // var VARS_MAP = new Map()
    // var EXCUT_STACK = Object.create(null)
    var SCOPE = new Map()
    TRAVEL_AST(ast_lex , SCOPE , Global_Scope)
}

function Parse_var(term_var , cur_scope ){

}

function Parse_term(term , cur_scope ){
    const {type , value } = term
    if(type.startsWith('const')){
        return type === 'const_num' ? Number(value) : value
    }else{
        return cur_scope.get(value) || Global_Scope.get(value)
    }
}

function Parse_expr(expr , cur_scope ){
    const { type ,value } = expr;
    if(['const_str' , 'const_num'].includes(type)){
        return type === 'const_num' ? Number(value) : value
    }else if(type === 'term_var'){
        var ret = cur_scope.get(value) || Global_Scope.get(value)
        if(!ret){
            throw '变量未声明'
            // console.log(expr);
        }else{
            return ret
        }
    }else{
        switch(type){
            case 'exp_add':
                const {left ,right} = expr
                return Parse_expr( left , cur_scope ) + Parse_expr( right , cur_scope );
            default:
                break;
        }
    }
}

function Parse_stmt_assign(stmt_assign , cur_scope ){
    const { _var , expr } = stmt_assign;
    const {value} = _var;
    var expr_value = Parse_expr(expr,cur_scope)
    if(Global_Scope.has(value)){
        Global_Scope.set(value , expr_value)
    }else{
        cur_scope.set(value , expr_value)
    }
}

function Parse_stmts( stmts , cur_scope ){
    for(let i = 0 ; i < stmts.length ; i++){
        Parse_stmt_assign(stmts[i] , cur_scope)
    }
}

function Parse_inequal(stmt_inequal , cur_scope ){
    const {left , right , type } = stmt_inequal
    let lvalue , rvalue;
    lvalue = left.type.startsWith('exp') ? Parse_expr(left , cur_scope) : Parse_term(left,cur_scope);
    rvalue = right.type.startsWith('exp') ? Parse_expr(right , cur_scope) : Parse_term(right,cur_scope);
    switch(type){
        case 'exp_eq':
            return lvalue == rvalue;
        case 'exp_nq':
            return lvalue !== rvalue;
        case 'exp_gt':
            return lvalue > rvalue;
        case 'exp_lt':
            return lvalue < rvalue;
        default:
            break;
    }
}

function Parse_if(stmt_if , cur_scope ){
    const {conds , if_body , else_body} = stmt_if
    if(!conds){
        throw '判断条件'+ conds + '为空'
    }else{
        if(Parse_inequal(conds , Global_Scope)){
            return Parse_stmts(if_body , cur_scope)
        }else{
            return Parse_stmts(else_body , cur_scope)
        }
    }
}

function Parse_while(stmt_while , cur_scope ){
    const {conds , body} = stmt_while
    if(!conds){
        throw '判断条件'+ conds + '为空'
    }else{
        while( Parse_inequal(conds , Global_Scope) ){
            Parse_stmts(body , cur_scope)
        }
    }
}

function Parse_def(stmt_def , cur_scope ){
    const {name} = stmt_def
    Global_Scope.set(name , stmt_def)
}

function Parse_Excut_Def(stmt_excut_def , cur_scope ){
    const { name , values } = stmt_excut_def;
    const { params , excuts , ret} = Global_Scope.get(name);
    params.forEach((item,id) => {
        cur_scope.set( item.value , values[id].value )
    })
    console.log(ret,'ret');
    excuts.length && Parse_stmts(excuts , cur_scope)
    return Parse_expr(ret , cur_scope);
}

function TRAVEL_AST(ast_lex , cur_scope , Global_Scope ){
    for(let i = 0 ; i < ast_lex.length ; i++){
        var Temp_Node = ast_lex[i]
        switch(Temp_Node.type){
            case 'def' : {
                Parse_def(Temp_Node , cur_scope)
                break;
            }
            case 'stm_if' : {
                Parse_if(Temp_Node , cur_scope)
                break;
            }
            case 'stm_while' : {
                Parse_while(Temp_Node ,cur_scope)
                break;
            }
            case 'stm_assign' : {
                Parse_stmt_assign(Temp_Node , Global_Scope )
                break;
            }
            case 'excut_def' :{
                console.log(Parse_Excut_Def(Temp_Node, cur_scope) , '???//')
                break;
            }
            default : {
                break;
            }
        }
    }
}
