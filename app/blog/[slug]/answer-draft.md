1. 为了避免ArticleHtmlContent因为弹层状态变化重新渲染，使用 memo后，只有html和onOpenMermaidPreview变化时博客才会重新渲染
2. 因为随后会对 innerHTML重新赋值为 svg元素
3. 不确定，推测是为了无障碍性友好
4. detach是 medium-zoom实例方法，可以解绑绑定到图片上的zoom行为，如果不提前解绑，就会在一个图片元素上重复绑定，容易出现多次 zoom
5. 为了保证代码的可维护性，一个大useEffect容易造成代码责任不清，这里的 useEffect分别用来处理：1.替换 mermaid图表为 svg文件，2.给正文中的普通图片添加 medium=zoom click event listener 3. 处理 mermaid 点击后的弹层逻辑
6. 说不清楚
7. 因为弹层不是 ArticleHtmlContent的子元素，放到外层更好管理
8. 之所以为这样是因为mermaidPreview数据发生了变化，导致PostContent重新渲染，这样正文原本的 svg图片就又变回了代码