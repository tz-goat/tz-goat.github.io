import AnalyticsLink from "@/app/analytics-link";
import { getAllPosts } from "@/lib/posts";

/**
 * 首页既承担个人介绍入口，也承担“最近写了什么”的分发职责。
 * 这里优先埋最新文章点击，方便判断简历访客更容易被哪篇内容吸引。
 */
export default function Home() {
  const posts = getAllPosts();
  const recentPosts = posts.slice(0, 3);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-2xl px-6 py-20">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          二魔的博客
        </h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400">
          记录学习与思考。
        </p>

        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-widest text-zinc-400 uppercase">
              最新文章
            </h2>
            <AnalyticsLink
              href="/blog"
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              eventName="blog_list_entry_click"
              eventOptions={{ props: { source: "home" } }}
            >
              全部文章 →
            </AnalyticsLink>
          </div>

          <ul className="mt-6 space-y-8">
            {recentPosts.map((post) => (
              <li key={post.slug}>
                <AnalyticsLink
                  href={`/blog/${post.slug}`}
                  className="group block"
                  eventName="post_list_click"
                  eventOptions={{
                    props: {
                      source: "home_recent_posts",
                      slug: post.slug,
                      title: post.title,
                    },
                  }}
                >
                  <time className="text-xs text-zinc-400">{post.date}</time>
                  <h3 className="mt-1 font-semibold text-zinc-900 group-hover:text-zinc-600 dark:text-zinc-50 dark:group-hover:text-zinc-300">
                    {post.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    {post.description}
                  </p>
                </AnalyticsLink>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
