"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *Created by guowenhuan on 2017/9/5
 */
var express = require("express");
var path = require("path");
var ws_1 = require("ws");
var app = express();
/**商品包含的信息*/
var Product = (function () {
    function Product(id, title, price, rating, desc, categories) {
        this.id = id;
        this.title = title;
        this.price = price;
        this.rating = rating;
        this.desc = desc;
        this.categories = categories;
    }
    return Product;
}());
exports.Product = Product;
/**评论信息*/
var Comment = (function () {
    function Comment(id, productId, timestamp, user, rating, content) {
        this.id = id;
        this.productId = productId;
        this.timestamp = timestamp;
        this.user = user;
        this.rating = rating;
        this.content = content;
    }
    return Comment;
}());
exports.Comment = Comment;
var products = [
    new Product(1, "第一个商品", 1.99, 1.5, "这是第一个商品，是我第一个Angular实战创建的", ["电子产品", "硬件产品"]),
    new Product(2, "第二个商品", 2.99, 2.5, "这是第二个商品，是我第一个Angular实战创建的", ["书类产品", "硬件产品"]),
    new Product(3, "第三个商品", 3.99, 3.5, "这是第三个商品，是我第一个Angular实战创建的", ["电子产品", "监控产品"]),
    new Product(4, "第四个商品", 1.99, 4.5, "这是第四个商品，是我第一个Angular实战创建的", ["健康产品", "硬件产品"]),
    new Product(5, "第五个商品", 4.99, 3.5, "这是第五个商品，是我第一个Angular实战创建的", ["服装", "书类产品"]),
    new Product(6, "第六个商品", 5.99, 5, "这是第六个商品，是我第一个Angular实战创建的", ["电子产品", "硬件产品"])
];
var comments = [
    new Comment(1, 1, "2017-08-14 22:22:22", "张三", 3, "东西不错"),
    new Comment(2, 1, "2017-06-14 22:22:22", "李四", 4, "东西是不错"),
    new Comment(3, 1, "2017-07-14 22:22:22", "王二", 5, "东西挺不错"),
    new Comment(4, 2, "2017-02-14 22:22:22", "孙五", 3, "东西还不错")
];
app.use('/', express.static(path.join(__dirname, '..', 'client')));
app.get('/api/products', function (req, res) {
    var _loop_1 = function (product) {
        var comment = comments.filter(function (comment) { return comment.productId == product.id; });
        if (comment.length > 0) {
            var sum = comment.reduce(function (sum, com) { return sum + com.rating; }, 0);
            product.rating = sum / comment.length;
        }
        else {
            product.rating = Math.random() * 5;
        }
    };
    for (var _i = 0, products_1 = products; _i < products_1.length; _i++) {
        var product = products_1[_i];
        _loop_1(product);
    }
    var result = products;
    var params = req.query;
    if (params.title) {
        result = result.filter(function (p) { return p.title.indexOf(params.title) !== -1; });
    }
    if (params.price && result.length > 0) {
        result = result.filter(function (p) { return p.price <= parseInt(params.price); });
    }
    if (params.category && params.category != '-1' && result.length > 0) {
        result = result.filter(function (p) { return p.categories.indexOf(params.category) !== -1; });
    }
    return res.json(result);
});
app.get('/api/product/:id', function (req, res) {
    return res.json(products.find(function (product) { return product.id == req.params.id; }));
});
app.get('/api/product/:id/comments', function (req, res) {
    return res.json(comments.filter(function (comment) { return comment.productId == req.params.id; }));
});
app.listen(9000, 'localhost', function () {
    console.log('服务器已启动，地址是：http:localhost:9000');
});
var wsServer = new ws_1.Server({ port: 8085 });
var subscriptons = new Map();
wsServer.on("connection", function (websocket) {
    websocket.on('message', function (message) {
        var messageObj = JSON.parse(message);
        var productIds = subscriptons.get(websocket) || [];
        subscriptons.set(websocket, productIds.concat([messageObj.productId]));
    });
});
var currentBids = new Map();
setInterval(function () {
    products.forEach(function (p) {
        var currentBid = currentBids.get(p.id) || p.price;
        var newBid = currentBid + Math.random() * 5;
        currentBids.set(p.id, newBid);
    });
    subscriptons.forEach(function (productIds, ws) {
        if (ws.readyState === 1) {
            var newBids = productIds.map(function (pid) { return ({
                productId: pid,
                bid: currentBids.get(pid)
            }); });
            ws.send(JSON.stringify(newBids));
        }
        else {
            subscriptons.delete(ws);
        }
    });
}, 2000);
