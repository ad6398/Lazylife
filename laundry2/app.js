var express=require("express"),
    bodyParser=require("body-parser"),
    flash=require("connect-flash"),
    mongoose=require("mongoose"),
    passport=require("passport"),
    localStrategy=require("passport-local"),
    passportlocalmongoose=require("passport-local-mongoose"),
    expresssession=require("express-session"),
    methodoverride=require("method-override");
var app=express();


mongoose.connect("mongodb://localhost/laundry");

//laundryschema

var laundrySchema=new mongoose.Schema({
    name:String,
    image:String,
    location:String,
    contact:Number,
    costpercloth:Number,
    description:String,
    avgtym:Number,
   
});
var laundry=mongoose.model("laundry",laundrySchema);


//orderSchema

var orderSchema=new mongoose.Schema({
    placedby:String,
    date:Date,
    contact:Number,
    placedfor:String
});
var order=mongoose.model("order",orderSchema);

//DhobhiSchema

var dhobhiSchema=new mongoose.Schema({
  name:String,
  image:String,
  location:String,
  contact:Number,
  costpercloth:Number,
  description:String,
  avgtym:Number,
  recieve:
  [
    {   type:mongoose.Schema.Types.ObjectId,
        ref:"order"
    }
  ],
});
var dhobhi=mongoose.model("dhobhi",dhobhiSchema);


//User

var userSchema=new mongoose.Schema({
     name:String,
     password:String
});
userSchema.plugin(passportlocalmongoose);
var user=mongoose.model("user",userSchema);


var userdhobhiSchema=new mongoose.Schema({
    name:String,
    password:String,
    show:{
        id:{
          type:mongoose.Schema.Types.ObjectId,
          ref:"dhobhi"
        }
    }
});
userdhobhiSchema.plugin(passportlocalmongoose);
var userdhobhi=mongoose.model("userdhobhi",userdhobhiSchema);


app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static(__dirname+"/partials"));
app.use(expresssession({
  secret:"amardeep",
  resave: false,
  saveUnintialized:false

}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodoverride("_method"));
app.use(flash());
/*passport.use(new localStrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());*/
passport.use(new localStrategy(userdhobhi.authenticate()));
passport.serializeUser(userdhobhi.serializeUser());
passport.deserializeUser(userdhobhi.deserializeUser());
app.use(function(req,res,next){
   res.locals.currentUser=req.user;
   res.locals.message=req.flash("error");
   res.locals.smessage=req.flash("success");
   next();
});

app.get("/",function(req,res){
        res.render("home");
})

app.get("/laundry",iscuslogin,function(req,res){
    laundry.find({},function(err,laundry){
        if(err)
          console.log(err);
        else{
          req.flash("success","welcome to lazylife laundry page");
          res.render("laundry",{laundry:laundry});
        }
    })
})

app.get("/laundry/:id",iscuslogin,function(req,res){
   laundry.findById(req.params.id,function(err,laundry){
       if(err)
         console.log(err);
       else{
           req.flash("success","Here is the info of "+laundry.name)
           res.render("show",{laundry:laundry});
       }
   })
});

app.get("/laundry/:id/confirmrequest",iscuslogin,function(req,res){
    laundry.findById(req.params.id,function(err,laundry){
        if(err)
          console.log(err);
        else{
            var dt=new Date();
            res.render("request",{laundry:laundry,dt:dt});
        }
    })
});

app.post("/confirmrequest",iscuslogin,function(req,res){
   order.create(req.body.order,function(err,order){
       if(err)
         console.log(err);
       else{
           var u=order.placedfor;
           console.log(req.body.name);
           dhobhi.find({name:"Ramdhani"},function(err,dhobhi){
               if(err)
                 console.log(err);
               else{
                   console.log(dhobhi);
                   dhobhi[0].recieve.push(order);
                   dhobhi[0].save();
                   //console.log(dhobhi);
               }
           })
            req.flash("success","THANK YOU ")
           res.render("confirm");
       }
   }) 
});

app.get("/laun/register",function(req,res){
    res.render("register");
});
  
app.post("/laundry/register",function(req,res){
userdhobhi.register(new userdhobhi({username:req.body.username}),req.body.password,function(err,user)
     {
        if(err)
        {   console.log(err);
            //req.flash("error",err.message);
            res.render("register");
        }
        passport.authenticate("local")(req,res,function()
        { req.flash("success","welcome to lazylife ");
          res.redirect("/laundry");
        })
     })
});

app.get("/laun/login",function(req,res){
    res.render("login");
});
  
app.post("/laundry/login",passport.authenticate("local" ,{
       successRedirect:"/laundry",
       failureRdeirect:"/laun/login"
      }) ,function(req,res){
       req.flash("success","Successfully logged u in !!!")
});

app.get("/laun/logout",function(req,res){
    req.logout();
    req.flash("error","Logged u out ,Successfully!!!")
    res.redirect("/");
});
  
function iscuslogin(req,res,next){
    if(req.isAuthenticated())
     next();
    else{
        res.redirect("/laun/login");
    }
}

app.get("/dhobhi",function(req,res){
    res.render("create");
})

app.post("/dhobhi",isdhologin,function(req,res){
    dhobhi.create(req.body.detail,function(err,dhobhi){
        if(err)
        console.log(err);
        else{
            laundry.create(req.body.detail);
            userdhobhi.findById(req.user._id,function(err,userdhobhi){
                if(err)
                  console.log(err);
                else{
                  userdhobhi.show.id=dhobhi;
                  userdhobhi.save();
                  //console.log(userdhobhi);
                }
            })
            res.render("showdhobhi",{dhobhi:dhobhi});
            console.log(req.user);
            //console.log(req.userdhobhi);
        }
    })
})

app.get("/userdhobhi/:id",isdhologin,function(req,res){
    userdhobhi.findById(req.user._id,function(err,userdhobhi){
        if(err)
           console.log(err);
        else{
            var x=userdhobhi.show.id;
            var y=String(x);
            console.log(typeof y);
            dhobhi.findById(y).populate("recieve").exec(function(err,dhobhi){
                if(err)
                  console.log(err);
                else{
                    console.log(dhobhi);
                    res.render("final",{dhobhi:dhobhi});
                }
            })
        }
    })
})

app.get("/dho/register",function(req,res){
    res.render("dhoregister");
});
  
app.post("/dho/register",function(req,res){
userdhobhi.register(new userdhobhi({username:req.body.username}),req.body.password,function(err,user)
     {
        if(err)
        {   console.log(err);
            //req.flash("error",err.message);
            res.render("dhoregister");
        }
        passport.authenticate("local")(req,res,function()
        { req.flash("success","welcome to yelpcamp "+ user.username);
          res.redirect("/dhobhi");
        })
     })
});

app.get("/dho/login",function(req,res){
    res.render("dhologin");
});
  
app.post("/dho/login",passport.authenticate("local" ,{
       successRedirect:"/userdhobhi/:id",
       failureRdeirect:"/dho/login"
      }) ,function(req,res){
        req.flash("success","Successfully logged u in !!!")
});

app.get("/dho/logout",function(req,res){
    req.logout();
    req.flash("success","Logged u out ,Successfully!!!")
    res.redirect("/");
});

function isdhologin(req,res,next){
    if(req.isAuthenticated())
     next();
    else{
        res.redirect("/dho/login");
    }
}

console.log("server started");
app.listen(10002,'127.0.0.1');