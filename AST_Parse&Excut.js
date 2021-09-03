// 词法解析器
let Global_Scope = new Map()

exports.PARSE_AST =  function(ast_lex){
    // var VARS_MAP = new Map()
    // var EXCUT_STACK = Object.create(null)
    var SCOPE = new Map()
    TRAVEL_AST(ast_lex , SCOPE , Global_Scope)
}

function Parse_var(term_var , cur_scope ){

}

function Parse_term(term , cur_scope ){
    const {type , value } = term
    console.log(type , value);
    if(type.startsWith('const')){
        return type === 'const_num' ? Number(value) : value
    }else{
        return cur_scope.get(value) || Global_Scope.get(value)
    }
}

function Parse_expr(expr , cur_scope ){
    const { type , value } = expr;
    console.log(expr);

    if(['const_str' , 'const_num'].includes(type)){
        return type === 'const_num' ? Number(value) : value
    }else if(type === 'term_var'){
        var ret = cur_scope.get(value) || Global_Scope.get(value)
        if(!ret){
            throw '变量未声明'
        }else{
            return ret
        }
    }else{
        switch(type){
            case 'exp_add':
                var {left ,right} = expr
                return Parse_expr( left , cur_scope ) + Parse_expr( right , cur_scope );
            case 'exp_mul':
                var {left ,right} = expr
                return Parse_expr( left , cur_scope ) * Parse_expr( right , cur_scope );
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

function Parse_PRINT(stm_print , cur_scope ){
    const {body} = stm_print
    console.log(Parse_expr(body , cur_scope));
}

function Parse_Excut_Def(stmt_excut_def , cur_scope ){
    const { name , values } = stmt_excut_def;
    const { params , excuts , ret} = Global_Scope.get(name);
    params.forEach((item,id) => {
        cur_scope.set( item.value , values[id].value )
    })
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
                Parse_Excut_Def(Temp_Node, cur_scope)
                break;
            }
            case 'stm_print' :{
                Parse_PRINT(Temp_Node, cur_scope)
                break;
            }
            default : {
                break;
            }
        }
    }
}
