useful info

- id: tweet 的唯一标识符

- conversation_id:  Tweets that are part of the same conversation will have the same "conversation_id." 可以用来构建网络关系

- date 日期标识符

- time 

- user_id, username

- tweet: 主要信息来源

- language 54 不同语言很多，英语占主导，可能给NLP任务带来困难

- mentions: tweet 中提到的用户名

- replies_count 
  retweets_count 
  likes_count 

  评价用户言论的重要性

- hashtags #... 之类的主题记号 比较重要，能直接标识话题

  - trump2020
  - bidenharris2020
  - trump
  - ...

- link 指向该条推特的链接

- quote_url 引用链接

- thumbnail 缩略图



功能设想

以每条 tweet 为节点，依据 conversation_id 构造图，依据 replies_count, retweets_count, likes_count 之和定义节点大小，依据对 tweet 情感分析的结果上色。

加上 mentions, retweet, user_rt_id,user_rt,retweet_id,reply_to，quote

数据可按时间段选取，默认选取所有时间段，可拖动进度条显示图像变化（每帧图展示一定时间粒度内的数据）

数据可按关键tag选取，选项

- 所有
- 含有 a
- 含有 b
- 含有 a和b
- 不含a,b

link 一张图，显示词云

要用到的数据



在10月21日-10月27日的 与美国总统选举有关的推特数据上，按照推特间的reply，mention，quote关系，我建立了一个用户的关系图，这张图中收获回复、转发、like越多的用户其圆的直径越大；对于每条推特，我利用JS的sentiment库进行了情感分析。当我点击用户关系图中的某个用户时，会关联地弹出该用户这一段时间内发送推特的sentiment.score的变化折线图，且鼠标悬浮在折线图上时，会呈现该条推特的具体内容，并给出sentiment.positive/negtive。对于这样的可视化，提出一个具体的探索问题，并细化成三个可视化支持的功能（例如，分析社交媒体的事件演变,可以进一步细化成社交媒体舆情的时间趋势,关键人物的行为和话题的演变）

