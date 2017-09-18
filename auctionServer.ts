
/**
 *Created by guowenhuan on 2017/9/5
 */
import * as express from 'express';

import * as path from 'path';

import {Server} from "ws";
 
const app = express();

/**商品包含的信息*/
export class Product{
    constructor(
        public id: number,
        public title:string,
        public price:number,
        public rating:number,
        public desc:string,
        public categories:Array<string>
    ){}
}


/**评论信息*/
export class Comment{
    constructor(
      public  id:number,
      public  productId:number,
      public  timestamp:string,
      public  user:string,
      public  rating:number,
      public  content:string
    ){}
  }

const products:Product[]=[
    new Product(1,"第一个商品",1.99,1.5,"这是第一个商品，是我第一个Angular实战创建的",["电子产品","硬件产品"]),
    new Product(2,"第二个商品",2.99,2.5,"这是第二个商品，是我第一个Angular实战创建的",["书类产品","硬件产品"]),
    new Product(3,"第三个商品",3.99,3.5,"这是第三个商品，是我第一个Angular实战创建的",["电子产品","监控产品"]),
    new Product(4,"第四个商品",1.99,4.5,"这是第四个商品，是我第一个Angular实战创建的",["健康产品","硬件产品"]),
    new Product(5,"第五个商品",4.99,3.5,"这是第五个商品，是我第一个Angular实战创建的",["服装","书类产品"]),
    new Product(6,"第六个商品",5.99,5,"这是第六个商品，是我第一个Angular实战创建的",["电子产品","硬件产品"])
];

const comments:Comment[]=[
    new Comment(1,1,"2017-08-14 22:22:22","张三",3,"东西不错"),
    new Comment(2,1,"2017-06-14 22:22:22","李四",4,"东西是不错"),
    new Comment(3,1,"2017-07-14 22:22:22","王二",5,"东西挺不错"),
    new Comment(4,2,"2017-02-14 22:22:22","孙五",3,"东西还不错")
  ]

app.use('/',express.static(path.join(__dirname,'..','client')));
app.get('/api/products',(req,res)=>{
    for(let product of products){
           let comment=comments.filter((comment:Comment)=>comment.productId==product.id);
           if(comment.length>0){
             let sum=comment.reduce((sum,com)=>sum+com.rating,0);
             product.rating=sum/comment.length;
           }else{
             product.rating=Math.random()*5;
          }       
    }
    let result=products;
    let params=req.query;

    if(params.title){
        result=result.filter((p)=>p.title.indexOf(params.title)!==-1);
    }
    if(params.price&&result.length>0){
        result=result.filter((p)=>p.price<=parseInt(params.price));
    }
    if(params.category&&params.category!='-1'&&result.length>0){
        result=result.filter((p)=>p.categories.indexOf(params.category)!==-1);
    }
    return res.json(result);
});

app.get('/api/product/:id',(req,res)=>{
    return res.json(products.find((product)=>product.id==req.params.id));
});

app.get('/api/product/:id/comments',(req,res)=>{
    return res.json(comments.filter((comment:Comment)=>comment.productId==req.params.id));
});

app.listen(9000,'localhost',()=>{
    console.log('服务器已启动，地址是：http:localhost:9000');
});

const wsServer=new  Server({port:8085});
const subscriptons=new Map<any,number[]>();
wsServer.on("connection",websocket=>{
    websocket.on('message',message=>{
        let messageObj=JSON.parse(<string>message);
        let productIds=subscriptons.get(websocket) || [];
        subscriptons.set(websocket,[...productIds,messageObj.productId]);
    });
});
const currentBids=new Map<number,number>();
setInterval(()=>{
    products.forEach(p=>{
        let currentBid=currentBids.get(p.id) || p.price;
        let newBid=currentBid+Math.random()*5;
        currentBids.set(p.id,newBid);
    });
    subscriptons.forEach((productIds:number[],ws)=>{
        if(ws.readyState === 1){
            let newBids=productIds.map(pid=>({
                productId:pid,
                bid:currentBids.get(pid)
            }));
            ws.send(JSON.stringify(newBids));
         }else{
            subscriptons.delete(ws);
         }
    });
},2000);