---
title: "Building My First ML Pipeline"
slug: "building-my-first-ml-pipeline"
description: "A first test of the new blog CMS and Markdown rendering"
excerpt: "A first test of the new blog CMS and Markdown rendering"
date: 2026-09-05
tags: []
published: true
---

# Building My First ML Pipeline

This is a test post for the new **Adrian — ML/AI Engineer** website.

The goal of this post is simple: verify that the blog CMS can create a post, save it to GitHub, and display the full article correctly on the `/blog/` page.

## Why Machine Learning?

Machine learning is not just about training models. A real ML system involves several stages:

* Collecting and cleaning data
* Feature engineering
* Training a model
* Evaluating performance
* Deploying the model
* Monitoring it in production

A simple way to think about an ML pipeline is:

`Data → Training → Evaluation → Deployment`

## A Small Example

Suppose we want to predict house prices.

We could have features such as:

* Area
* Number of rooms
* Location
* Age of the building

The model learns a relationship between these features and the target value.

```python
model.fit(X_train, y_train)
predictions = model.predict(X_test)
```

The important part is not just getting a prediction, but understanding **why the model behaves the way it does**.

## Final Thought

This is only a test article, but eventually this section will contain my notes, experiments, technical deep-dives, and things I learn while building ML/AI systems.

> Build. Learn. Research. Repeat.

**— Adrian**
