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

class Exp_MUl extends Type_{
    constructor(left , right ){
        super('exp_mul')
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

class Stm_PRINT extends Type_ {
    constructor(body){
        super('stm_print')
        this.body = body
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
var len = file.length , i = 0 ;

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
    }else if(cur_file.startsWith('print')){
        cur_file = deal_word(cur_file , 'print')
    }else{
        var loc = cur_file.indexOf(';');
        // console.log( cur_file.slice(0,loc).match(/\(\s*\)/) );
        if(cur_file.slice(0,loc).match(/\([^\(|\)]*\)/)){
            cur_file = deal_word(cur_file , 'excut_def')
            // cur_file = cur_file.slice(loc+1)
        }else{
            cur_file = deal_word(cur_file , 'expr')
        }
    }
}


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

function cons_stmt_print( body ){
    return new Stm_PRINT( cons_expr(body))
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
                return word.slice(props_e+2).trim()
            }
            case 'print':{
                AST_W.push(cons_stmt_print(word.slice(name_e,props_e).trim()))
                return word.slice(props_e+2).trim()
            }
            default:
                break;
        }
        return word.slice(next_part + 1).trim()
    }
}
console.log('###############################################');

// console.log(AST_W , 'AST_W');

const {PARSE_AST} = require('./AST_Parse&Excut');
PARSE_AST(AST_W)