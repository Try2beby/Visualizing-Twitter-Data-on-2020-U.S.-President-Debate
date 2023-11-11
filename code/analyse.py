import json
import os
import re
import pandas as pd

datapath = "./data/"
usedatapath = "./usedata/"
dataname = "2020-10-2%d.json"
day = range(6)

use_columns = [
    "id",
    "conversation_id",
    "date",
    "time",
    "user_id",
    "username",
    "tweet",
    "language",
    "hashtags",
    "replies_count",
    "retweets_count",
    "likes_count",
]


def processjson(filename, outpath="./usedata/"):
    with open(filename, "r") as f:
        lines = f.readlines()
    # Parse each line as a JSON object and add to a list
    data = [json.loads(line) for line in lines]
    print(len(data))
    # if outpath not exist, create it
    os.makedirs(outpath, exist_ok=True)
    # Write the list of JSON objects to a new file
    with open(outpath + filename, "w") as f:
        json.dump(data, f)


# transform raw json file to standard json file
for i in day:
    filename = dataname % i
    # processjson(datapath + filename)


def load_df(filename, datapath=usedatapath):
    with open(datapath + filename, "r") as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    print("load %s successfully" % filename)
    print("data shape: ", df.shape)

    return df


def clean_df(df, use_columns=use_columns):
    df = df[use_columns]
    df = df.drop_duplicates(subset=["id"])
    df = df.dropna(subset=["tweet"])
    df = df.reset_index(drop=True)
    print("clean data successfully")
    print("data shape: ", df.shape)

    return df


def clean_tweets(df):
    def clean_tweet(tweet):
        tweet = re.sub("RT @[\w]*:", "", tweet)
        tweet = re.sub("@[\w]*", "", tweet)
        tweet = re.sub("https?://[A-Za-z0-9./]*", "", tweet)
        tweet = re.sub("\n", "", tweet)
        return tweet

    # apply clean_tweet function to each tweet
    df["tweet"] = df["tweet"].apply(clean_tweet)

    return df


def add_tags(df):
    def add_tag(text):
        if "biden" in text.lower():
            if "trump" in text.lower():
                return 3
            else:
                return 1
        elif "trump" in text.lower():
            return 2
        else:
            return 0

    # apply add_tag function to each tweet
    df["tag"] = df["tweet"].apply(add_tag)

    return df


def plot_wordcloud(df, tag_list):
    from wordcloud import WordCloud, STOPWORDS
    import matplotlib.pyplot as plt

    # select tweets with tag in tag_list
    text = " ".join(df[df["tag"].isin(tag_list)]["tweet"])
    # Create a wordcloud object
    stopwords = set(STOPWORDS)
    wordcloud = WordCloud(
        width=800,
        height=800,
        background_color="white",
        stopwords=stopwords,
        min_font_size=10,
    ).generate(text)

    # plot the wordcloud object
    plt.figure(figsize=(8, 8), facecolor=None)
    # turn off the axis
    plt.axis("off")

    plt.imshow(wordcloud)


def create_graph(df):
    import networkx as nx
    import matplotlib.pyplot as plt

    # create a new df with only tweet id and conversation id
    df_id = df[["id", "conversation_id"]].copy()

    # transform conversation id datatype to int
    df_id["conversation_id"] = df_id["conversation_id"].astype(int)

    # create graph
    G = nx.Graph()

    # add nodes
    G.add_nodes_from(df_id["id"].tolist())

    # add edges,from id to conversation id
    for i in range(len(df_id)):
        if df_id.iloc[i, 0] != df_id.iloc[i, 1]:
            G.add_edge(df_id.iloc[i, 0], df_id.iloc[i, 1])

    # plot the graph
    plt.figure(figsize=(20, 20))
    nx.draw(G, with_labels=False, node_size=10)


def tanslates(df):
    def translate(language, tweet):
        from googletrans import Translator

        translator = Translator()
        if language != "en":
            try:
                tweet = translator.translate(tweet).text
            except:
                pass
        return tweet

    # apply translate function to each tweet
    df["tweet"] = df.apply(lambda x: translate(x["language"], x["tweet"]), axis=1)


def language_filter(df, thereshold=100):
    # count the number of tweets in each language
    language_count = df["language"].value_counts()
    # select languages with more than thereshold tweets
    language_list = language_count[language_count > thereshold].index.tolist()
    # select tweets with language in language_list
    df = df[df["language"].isin(language_list)]
    df = df.reset_index(drop=True)

    return df
