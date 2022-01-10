var express = require('express');
var mysql = require('mysql');
var encryptUtil = require('./utils/encrypt')
var app = express();
var bodyParser = require('body-parser');

const urlencodedParser = bodyParser.urlencoded({ extended: false }); //处理post请求体

const encryptPasswordsSql = " select p.*,pt.typeName,'***' as password from password p " + 
                               " left join password_type pt on p.typeId = pt.id where 1=1 "; //查询所有数据

const addPasswordSql = "insert into password set ? "; //插入数据

const updatePasswordSql = "update password set title = ?,typeId = ?,username = ?,passwordEncrypt = ?,host = ?,port = ? where id = ?";

const deletePasswordSql = "delete from password where id = ?";

//创建连接
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    port: '3306',
    database: 'pm'
});

//连接
db.connect((err) => {
    if (err) throw err;
    console.log('数据库连接成功');
})

//返回给前端的结果
var getReturnResult = function (data) {
    return {
        code: 0,
        data: data,
        msg: 'success'
    };
}

//返回给前端的结果(失败)
var getReturnErrorResult = function (msg) {
    return {
        code: -1,
        msg: msg
    };
}

//解密密码
var deCrypt = function (key, data) {
    var passwordEncrypt = data.passwordEncrypt;
    var password = encryptUtil.decrypt(key, passwordEncrypt);
    data['password'] = password;
    return data;
}

//根据请求参数拼接sql
var getEncryptPasswordsSql = function(data) {
    var sql = encryptPasswordsSql;
    if(data['title']){
        sql = sql + " and title like '%" + data['title'] + "%' ";
    }
    if(data['username']){
        sql = sql + " and username like '%" + data['username'] + "%' ";
    }
    if(data['typeId']){
        sql = sql + " and typeId = " + data['typeId'] + " ";
    }
    sql = sql + " order by id ";
    return sql;
}

//首页
app.get('/', function (req, res) {
    res.sendFile(__dirname + "/html/index.html");
});

//密码列表(未解密)
app.post('/encryptPasswords', urlencodedParser, function (req, res) {
    var data = req.body;
    db.query(getEncryptPasswordsSql(data), (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.json(getReturnResult(result));
        }
    })
});

//添加密码
app.post('/addPassword', urlencodedParser, function (req, res) {
    var data = req.body;
    data['passwordEncrypt'] = encryptUtil.encrypt(data.key, data.password);
    delete data.key;
    delete data.password;
    db.query(addPasswordSql, data, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(getReturnResult('添加成功'));
        }
    });
});

//修改
app.post('/updatePassword', urlencodedParser, function (req, res) {
    var data = req.body;
    var id = data.id;
    var key = data.key;
    var sql = encryptPasswordsSql + " and p.id = " + id;
    db.query(sql, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            if(result.length == 0){
                res.json(getReturnErrorResult('密码不存在'));
            }
            var passwordEncrypt = result[0].passwordEncrypt;
            var password = encryptUtil.decrypt(key, passwordEncrypt);
            if(password == '解密失败'){
                res.json(getReturnErrorResult('修改失败，秘钥不正确'));
            }else{
                data['passwordEncrypt'] = encryptUtil.encrypt(data.key, data.password);
                const updateParams = [data.title,data.typeId,data.username,data.passwordEncrypt,data.host,data.port,data.id];
                db.query(updatePasswordSql, updateParams, (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        res.send(getReturnResult('修改成功'));
                    }
                });
            }
        }
    })
});

//删除
app.post('/deletePassword', urlencodedParser, function (req, res) {
    var data = req.body;
    var id = data.id;
    var key = data.key;
    var sql = encryptPasswordsSql + " and p.id = " + id;
    db.query(sql, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            if(result.length == 0){
                res.json(getReturnErrorResult('密码不存在'));
            }
            var passwordEncrypt = result[0].passwordEncrypt;
            var password = encryptUtil.decrypt(key, passwordEncrypt);
            if(password == '解密失败'){
                res.json(getReturnErrorResult('删除失败，秘钥不正确'));
            }else{
                const deleteParams = [data.id];
                db.query(deletePasswordSql, deleteParams, (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {
                        res.send(getReturnResult('删除成功'));
                    }
                });
            }
        }
    })
});

//密码列表(解密)
app.post('/passwords', urlencodedParser, function (req, res) {
    var data = req.body;
    db.query(getEncryptPasswordsSql(data), (err, result) => {
        if (err) {
            console.log(err);
        } else {
            for (var i = 0; i < result.length; i++) {
                result[i] = deCrypt(data.key, result[i]);
            }
            res.json(getReturnResult(result));
        }
    })
});

//密码详情(解密)
app.post('/detail', urlencodedParser, function (req, res) {
    var data = req.body;
    var id = data.id;
    var key = data.key;
    var sql = encryptPasswordsSql + " and p.id = " + id;
    db.query(sql, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            if(result.length == 0){
                res.json(getReturnErrorResult('查询失败'));
            }
            var passwordEncrypt = result[0].passwordEncrypt;
            var password = encryptUtil.decrypt(key, passwordEncrypt);
            if(password == '解密失败'){
                res.json(getReturnErrorResult('解密失败，秘钥不正确'));
            }else{
                var returnData = result[0];
                returnData['password'] = password;
                res.json(getReturnResult(returnData));
            }
        }
    })
});

//启动服务器
var server = app.listen(8888, function () {

    var port = server.address().port
    console.log("项目成功运行，使用 http://%s:%s 进行访问", '127.0.0.1', port)

})