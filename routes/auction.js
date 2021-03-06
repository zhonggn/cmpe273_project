var sql_con = require('../conn'),
	fs   = require('fs');
	
var Memcached = require('memcached');
var memcached = new Memcached('localhost:11211');

function getAllAuction(req, res){
	
	if(!req.isAuthenticated())
	 {
		 res.redirect('/login');
		}
	var userId = req.user.userid;
	
	var qS = "select * from `cmpe273project`.`auction`;";

	sql_con.fetchData(qS, function(error, rows){
		
		res.render('index',{data: rows});
	});
}

function getAuction(req, res){
	
	if(!req.isAuthenticated())
	 {
		 res.redirect('/login');
		}
	var userId = req.user.userid;
	var userEmail = req.user.email;
	var auctionId = req.params.auctionid;
	
	var qS = "SELECT auction.product as product, auction.currentprice as currentprice, auction.addprice as addprice, auction.bidnum as bidnum, auction.minremain as minremain, user.email as selleremail, user.userid as sellerid FROM `cmpe273project`.`auction` auction join cmpe273project.user user WHERE auction.seller = user.userid and auction.id = '" + auctionId + "';";

	sql_con.fetchData(qS, function(error, rows){
		
		if(rows == null || rows.length < 1){
			
			res.render('404page', {message : "No such auction."});
			return;
		}
		
		if(rows[0].inprogress == 'false'){
			
			res.render("auctionclosed");
		}
		else if(rows != null && rows.length > 0){
			
			qS2 = "SELECT * FROM `cmpe273project`.`product` WHERE id = '" + rows[0].product + "';";
			
			sql_con.fetchData(qS2, function(error, rows2){
				
				var currentPrice = rows[0].currentprice;
				//var seller = 
				var condition = rows2[0].condi;
				var name = rows2[0].name;
				var addPrice = rows[0].addprice;
				var bidNum = rows[0].bidnum;
				var minRemain = parseInt(rows[0].minremain);
				var sellerEmail = rows[0].selleremail;
				var sellerId = rows[0].sellerid;
				
				var days = parseInt(minRemain/(24*60));
				var hours = parseInt(minRemain%(24*60)/60);
				var mins = minRemain%(24*60)%60;
				var timeRemain = days + ' days ' + hours + ' hours ' + mins + ' mins';
				
				var pictureUrl = rows2[0].pictureurl;
				res.render('auction',{user: req.user, email : userEmail, productname: name, currentprice: currentPrice, condition: condition, addprice: addPrice, bidnum: bidNum, pictureurl: pictureUrl, auctionid: auctionId, timeremain:timeRemain, selleremail: sellerEmail, sellerid: sellerId});
			});
		}

	});
}

function createAuction(req, res){
	if(!req.isAuthenticated())
	 {
		 res.redirect('/login');
		}
	var userId=req.user.userid;
	var userEmail = req.user.email;
	//if(!req.isAuthenticated()){res.redirect('/login');}
	console.log("Inside createAuction");

	console.log(req.files);

	var len = req.files.image.path.length;
	var pictureUrl = req.files.image.path.substring(42,len);
	var name = req.body.productname; 
	var des = req.body.des;
	var cat = req.body.cat;
	var condition = req.body.condition;
	var soa = "auction";
	
	var qS = "INSERT INTO `cmpe273project`.`product` (`name`, `description`, `owner`, `cat`, `pictureurl`, `sellorauction`, `condi`) VALUES ('" + name + "', '" + des + "', " + userId + ", '" + cat + "', '" + pictureUrl + "', '" + soa + "', '" + condition + "');";
	sql_con.insert(qS);
	
	var qS2 = "SELECT * FROM `cmpe273project`.`product` WHERE name = '" + name + "' and description = '" + des + "' and owner = " + userId + " and cat = '" + cat + "' and pictureurl = '" + pictureUrl + "' and sellorauction = '" + soa + "' and condi = '" + condition + "';";
	
	sql_con.fetchData(qS2, function(error, rows){
		
		console.log("rows size: " + rows.length);
		var productId = parseInt(rows[0].id);
		console.log("Id is " + productId);
		
		var dateObj = new Date();
		var month = dateObj.getUTCMonth() + 1; //months from 1-12
		var day = dateObj.getUTCDate();
		var year = dateObj.getUTCFullYear();
		var date = month + "/" + day + "/" + year;
		
		var startDate = date;
		var startPrice = req.body.startprice;
		var addPrice = req.body.addprice;
		var inProgress = "true";
		var duration = req.body.duration;
		var minRemain = parseInt(duration) * 24 * 60;
		
		var qS = "INSERT INTO `cmpe273project`.`auction` (`product`, `startdate`, `seller`, `startprice`, `addprice`, `minremain`, `inprogress`, `currentprice`, `bidnum`) VALUES ('" + productId + "', '" + startDate + "', '" + userId +  "', '" + startPrice + "', '" + addPrice + "', '" + minRemain + "', '" + inProgress + "', '" + startPrice + "', '" + 0 + "');";

		sql_con.insert(qS);
		
		var qS3 = "SELECT * FROM `cmpe273project`.`auction` WHERE product = '" + productId + "' and startdate = '" + startDate + "' and seller = '" + userId + "' and startprice = '" + startPrice + "' and addprice = '" + addPrice + "' and inprogress = '" + inProgress + "' and currentprice = '" + startPrice + "' and bidnum = '" + 0 + "';";

		sql_con.fetchData(qS3, function(error, rows2){
			
			var auctionId = parseInt(rows2[0].id);
			//res.render('auctiondetail',{email : "a", productname: name, currentprice: startPrice, condition: condition, addprice: addPrice, bidnum: 0, pictureurl: pictureUrl, auctionid: auctionId});
			res.redirect('/auction/' + auctionId);
		});

		//res.render('auction');
	});
	
}

function createAuctionPage(req, res){
	
	if(!req.isAuthenticated())
	 {
		 res.redirect('/login');
		}
	var userId=req.user.userid;
	var userEmail = req.user.email;
	
	if(false){res.redirect('/login');}
	
	else{
		
		var qS = "SELECT * FROM cmpe273project.cat;";
		
		sql_con.fetchData(qS, function(error, rows){

			res.render('auctioncreation', {user: req.user, cats: rows});
	});
	
	}
}

function getBid(req, res){
	
	if(!req.isAuthenticated())
	 {
		 res.redirect('/login');
		}
	var userId=req.user.userid;
	var userEmail = req.user.email;
	
	var auctionId = req.params.auctionid;
	
	qS = "SELECT * FROM `cmpe273project`.`bid` WHERE auction = " + auctionId + ";";
	sql_con.fetchData(qS, function(error, rows){
		
		if(rows == null || rows.length < 1){
			
			res.render('404page', {message : "No such bid history."});
			return;
		}

		qS2 = "SELECT * FROM `cmpe273project`.`auction` WHERE id = " + auctionId + ";";
		sql_con.fetchData(qS2, function(error, rows2){
			
			if(rows2 == null || rows2.length < 1){
				
				res.render('404page', {message : "No such auction."});
				return;
			}
			
			var minRemain = parseInt(rows2[0].minremain);
			
			var days = parseInt(minRemain/(24*60));
			var hours = parseInt(minRemain%(24*60)/60);
			var mins = minRemain%(24*60)%60;
			var timeRemain = days + ' days ' + hours + ' hours ' + mins + ' mins';
			
			var bidNum = rows2[0].bidnum;
			var startPrice = rows2[0].startprice;
			var startDate = rows2[0].startdate;
			
			res.render('bids', {user: req.user, bids: rows, bidnum: bidNum, startprice: startPrice, startdate: startDate, auctionid: auctionId, email: req.user.email, timeremain: timeRemain});
		});
		
});

}

function bidAuction(req, res){
	
	if(!req.isAuthenticated())
	 {
		 res.redirect('/login');
		}
	var userId=req.user.userid;
	var userEmail = req.user.email;
	
	var auctionId = req.params.auctionid;
	var qS = "SELECT * FROM `cmpe273project`.`auction` WHERE id = " + auctionId + ";";
	sql_con.fetchData(qS, function(error, rows){
		
		if(rows == null || rows.length < 1){
			
			res.render('404page', {message : "No such auction."});
			return;
		}
		
		if(rows[0].inprogress == 'false'){
			
			res.render("auctionclosed");
		}
		else{
			
			var auctionId = req.params.auctionid;
			var currentPrice = rows[0].currentprice;
			var bidNum = parseInt(rows[0].bidnum) + 1;
			var price = rows[0].addprice + currentPrice;
			
			var dateObj = new Date();
			var month = dateObj.getUTCMonth() + 1; //months from 1-12
			var day = dateObj.getUTCDate();
			var year = dateObj.getUTCFullYear();
			var date = month + "/" + day + "/" + year;
			
			qS2 = "INSERT INTO `cmpe273project`.`bid` (`auction`, `price`, `bidder`, `date`, `finalbid`) VALUES ('" + auctionId + "', " + price + ", '" + userEmail + "' , '" + date + "', '" + false + "');";
			sql_con.insert(qS2);
			
			qS3 = "UPDATE `cmpe273project`.`auction` SET `bidnum`='" + bidNum + "' WHERE `id`='"+ auctionId + "';";
			sql_con.insert(qS3);
			
			qS3 = "UPDATE `cmpe273project`.`auction` SET `currentprice`='" + price + "' WHERE `id`='"+ auctionId + "';";
			sql_con.insert(qS3);
			res.redirect('/bid/' + auctionId);
		}
	});
	
}

//for bidder
function getBidHis(req, res){
	
	if(!req.isAuthenticated())
	 {
		 res.redirect('/login');
		}
	var userId=req.user.userid;
	var userEmail = req.user.email;
	var qS = "SELECT product.name as name, product.pictureurl as url, auction.currentprice as finalprice, bid.date as date FROM cmpe273project.auction auction join cmpe273project.product product join cmpe273project.bid bid where auction.id = bid.auction and product.id = auction.product and bid.finalbid = 'true' and bid.bidder = '" + userEmail + "';";
	
	sql_con.fetchData(qS, function(error, rows){
			
//			if(rows == null || rows.length < 1){
//				
//				res.render('404page', {message : "No such bid history."});
//				return;
//			}
			
			var qS2 = "SELECT product.name as name, product.pictureurl as url, bid.price as price, bid.date as date, bid.id as id, auction.id as auctionid FROM cmpe273project.auction auction join cmpe273project.product product join cmpe273project.bid bid where auction.id = bid.auction and product.id = auction.product and auction.inprogress = 'true' and bid.bidder = '" + userEmail + "';";
			
			sql_con.fetchData(qS2, function(error, rows2){
				
//				if(rows2 == null || rows2.length < 1){
//					
//					res.render('404page', {message : "No such bid history."});
//					return;
//				}
				
				res.render('bidhis', {winBids: rows, onGBids: rows2, user: req.user});
				
			});
				
			
	});
	
}

//for seller
function getAucHis(req, res){
	
	if(!req.isAuthenticated())
	 {
		 res.redirect('/login');
		}
	var userId=req.user.userid;
	var userEmail = req.user.email;
	var qS = "SELECT product.name as name, product.pictureurl as url, auction.currentprice as finalprice, bid.date as date FROM cmpe273project.auction auction join cmpe273project.product product join cmpe273project.bid bid where auction.id = bid.auction and product.id = auction.product and auction.inprogress = 'false' and product.owner = "+ userId +" and bid.finalbid = 'true';";
		
	sql_con.fetchData(qS, function(error, rows){
			
//			if(rows == null || rows.length < 1){
//				
//				res.render('404page', {message : "No such auction history."});
//				return;
//			}
			
			var qS2 = "SELECT product.name as name, product.pictureurl as url, auction.currentprice as currentprice, auction.id as id FROM cmpe273project.auction auction join cmpe273project.product product where product.id = auction.product and auction.inprogress = 'true' and product.owner = " + userId + ";";
			
			sql_con.fetchData(qS2, function(error, rows2){
				
             console.log(rows2);
				
				res.render('auchis', {ca: rows, oa: rows2, user: req.user});
			});
			
	});
	
}

function checkOut(req, res){
	
	if(!req.isAuthenticated())
	 {
		 res.redirect('/login');
	}
	var userId=req.user.userid;
	var userEmail = req.user.email;
	
	var qS = "SELECT * from cart where userid = " + userId + "";
	
	sql_con.fetchData(qS, function(error, rows){
		
		if(rows == null || rows.length < 1){
			
			res.render('404page', {message : "Shopping cart is empty."});
			return;
		}
		
		console.log(rows.length);
		
		for(var i = 0; i < rows.length; i ++){
			
			
			var cartId = rows[i].cartid;
			var sellingId = rows[i].sellingid;
			var dateObj = new Date();
			var quantity = rows[i].num;
			var month = dateObj.getUTCMonth() + 1; //months from 1-12
			var day = dateObj.getUTCDate();
			var year = dateObj.getUTCFullYear();
			var date = month + "/" + day + "/" + year;
			
			var qS2 = "INSERT INTO `cmpe273project`.`buying` ( `selling`, `buyer`, `date`, `quantity`) VALUES ( '" + sellingId + "', '" + userId + "', '" + date + "', " + quantity + ");";
			sql_con.insert(qS2);
			var qS2 = "DELETE FROM `cmpe273project`.`cart` WHERE `cartid`='" + cartId + "';";
			sql_con.insert(qS2);
			var qS2 = "UPDATE `cmpe273project`.`selling` SET `quantity`= `quantity` - " + quantity + " WHERE `id`='" + sellingId + "';";
			sql_con.insert(qS2);
		}
		
		res.render('checkout');
	});
	
}

function noCache(req, res){
	
	var qS = "select * from cmpe273project.user where userid = 1";
	sql_con.fetchData(qS, function(error, rows){
		
		
		res.render('perftest', {data: rows[0]});
	});
	
	
}

function cache(req, res){
	
	var qS = "select * from cmpe273project.user where userid = 1";
	
	sql_con.fetchDataC(qS, function(error, rows){
		
		res.render('perftest', {data: rows[0]});
	});
	
//	memcached.set('foo', 'world', lifetime, function( err, result ){
//		  if( err ) console.error( err );
//		  console.dir( result );
//	});
	
	
//	memcached.get('foo', function (err, data) {
//		  
//		if(err || data == null){
//			
//			console.log("No such data");
//			memcached.set('foo', {"a": "b"}, 100, function (err) { /* stuff */ });
//			res.render('perftest', {data: {"a": "b"}});
//			
//		}
//		else{
//			
//			console.log("There is no error");
//			console.log(data);
//			res.render('perftest', {data: data});
//		}
//	});
	
}

function deleteUser(req, res){
	
	var deleteUserId = req.body.deleteuserid;
	var qS = "DELETE FROM `cmpe273project`.`user` WHERE `userid`='" + deleteUserId + "';";
	sql_con.insert(qS);
	res.redirect('/customer');
}

function deleteAuction(req, res){}

exports.getAllAuction = getAllAuction;
exports.getAuction = getAuction;
exports.createAuction = createAuction;
exports.createAuctionPage = createAuctionPage;
exports.bidAuction = bidAuction;
exports.deleteAuction = deleteAuction;
exports.getBid = getBid;
exports.getBidHis = getBidHis;
exports.getAucHis = getAucHis;
exports.chechOut = checkOut;
exports.noCache = noCache; 
exports.cache = cache;
exports.deleteUser = deleteUser;