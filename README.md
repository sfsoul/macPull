### 记录mac提交代码到github

```
touch README.md
git init  //初始化本地仓库
git add README.md //添加刚刚创建的README文档
git commit -m "注释"
git remote add origin git@github.com:yourname/xxxx.git  //连接远程仓库并建了一个名叫：origin的别名，当然可以为其他名字，但是origin一看就知道是别名，youname记得替换成你的用户名 
git push -u origin master  //将本地仓库的文件提交到别名为origin的地址的master分支下，-u为第一次提交，需要创建master分支，下次就不需要了 

//第二次提交
git add .
git commit -m "some new"
git push origin master
```

