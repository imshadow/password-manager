/**
 * ASE加密解密工具类
 */
var crypto = require('crypto');

const iv = '1581561006515501'; //向量
const encryptErrorText = '加密失败'; //加密失败返回的数据
const decryptErrorText = '解密失败'; //解密失败返回的数据

/**
 * 加密方法
 * @param key 加密key
 * @param data  需要加密的数据
 * @returns string
 */
var encrypt = function (key, data) {
    try{
        var cipher = crypto.createCipheriv('aes-128-cbc', getKey(key), iv);
        var crypted = cipher.update(data, 'utf8', 'binary');
        crypted += cipher.final('binary');
        crypted = Buffer.from(crypted, 'binary').toString('base64');
        return crypted;
    }catch(err){
        return encryptErrorText;
    }
};

/**
 * 解密方法
 * @param key 解密的key
 * @param crypted  密文
 * @returns string
 */
var decrypt = function (key, crypted) {
    try{
        crypted = Buffer.from(crypted, 'base64').toString('binary');
        var decipher = crypto.createDecipheriv('aes-128-cbc', getKey(key), iv);
        var decoded = decipher.update(crypted, 'binary', 'utf8');
        decoded += decipher.final('utf8');
        return decoded;
    }catch(err){
        return decryptErrorText;
    }
};

/**
 * 对加解密的key进行截取
 * 超过16位，则截取前16位
 * 不足161位，则往后补0
 */
var getKey = function (key) {
    if(key.length > 16){
        key = key.substring(0,16);
    }else{
        var length = key.length;
        for(;length < 16;length++){
            key = key + '0';
        }
    }
    return key;
}

module.exports = {
    encrypt,
    decrypt
}