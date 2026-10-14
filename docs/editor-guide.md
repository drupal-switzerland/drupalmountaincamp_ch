# Editor Guide

For everyone who writes or edits content on the Mountain Camp site. No technical
knowledge needed. Each section has one rule, why it matters, and one example.

Field names are written as Drupal shows them, for example **Teaser**.

## Title

- Keep titles short and specific. The site adds " | Mountain Camp" to the title
  of every page except the homepage, and search engines cut off titles that are
  too long.
- Do: "Keynote Speakers Announced"
- Do not: "Exciting News: We Are Happy to Announce Our Keynote Speakers for
  This Year, Session Selection Updates and More"

## Teaser

The **Teaser** field is on the edit form of every news article and page. It is
required. Older content may still be without one.

- The teaser is the short text people see before they open the page: in search
  results, when the link is shared, in the news list, and in teasers on other
  pages.
- Write one or two plain sentences that say what the page is about. The counter
  under the field allows 180 characters.
- Plain text only. No links, headings or formatting: the whole teaser card is
  one link, and a link inside a link does not work.
- Where a teaser is missing, a news article falls back to its lead. Without a
  lead, and on every other page, the general description of the whole site is
  shown, the same text on every such page.
- Do: "The call for sessions is open until the end of the month. Six tracks,
  from first-time speakers to deep technical talks."
- Do not: paste the first paragraph of the page.

## Lead

The **Lead** field is on the same form.

- The lead is the larger introduction shown directly under the title on the
  page itself. It is optional.
- The teaser brings people to the page. The lead starts the page. They can be
  similar, but each has its own job.
- Do: one or two sentences that set up the article.
- Do not: copy the first paragraphs of the text into the lead. Visitors and
  screen readers then get the same text twice.

## Headings in Text

- The page title is the top heading. In the text editor, start with
  **Heading 2**. Use **Heading 3** only inside a Heading 2 section, and
  **Heading 4** only inside a Heading 3 section.
- Inside a block that has its own title, start one level below that title.
  In an accordion or a text with image block that is **Heading 3**. In an
  icon text item it is **Heading 4**.
- Never skip a level, and never pick a heading for its size.
- A line that names the section below it is a heading. Do not use bold text or
  a plain paragraph for it. The **Label** style is the exception: it is the
  small line above a heading, not a heading.
- Why: people using a screen reader jump from heading to heading.
- Do: Heading 2 "Getting There", then Heading 3 "By Train" and "By Car".
- Do not: go from the title straight to Heading 3 because it looks better.

## Links

- The link text says where the link goes. Many people read only the links.
- Do: "Read the travel guide before you book", with "travel guide" as the
  link.
- Do not: "The travel guide is here", with "here" as the link.
- The text and the target must match. Check that a link named after one thing
  does not open a page about another.
- A link inside a text takes an address only, for example `/tickets`. The
  link field there offers no suggestions.
- A page gets a new address when its title changes. The old address then
  forwards to the new one. Still update links you know of: if another page
  later takes the old address, old links open that page.
- Renaming a page while it is unpublished drops its old addresses. They no
  longer forward, also after the page is published again.
- The **Link** field of a button block is different: start typing the title
  of the page and choose it from the suggestions. A link chosen this way
  follows the page to its new address.
- Use **Open in new window** sparingly. The site does not tell visitors that
  such a link opens a new tab, so say it in the link text.
- When a page is removed or renamed, search for links to it. Old news articles
  often link to pages from earlier years that no longer exist. Remove such a
  link and keep the text.
- The editor cannot mark a passage as being in another language. If a text
  needs it, tell whoever maintains the site.

## Images

Add images as media items, through an image block or an image field. Do not use
the image button in the text editor: it takes an address instead of a media
item, has no **Copyright** field, and the site removes images that are stored
on another website.

### Alternative Text

This field is required.

- Describe what this picture shows, in one sentence. It is read aloud by screen
  readers and shown when the image does not load.
- Do: "Three people laughing at a table with laptops, snowy mountains behind
  the window."
- Do not: "Attendees 2024" on several different photos. Each picture gets its
  own description.
- If the image is mostly words, such as a poster or a slide, put the words on
  the page as normal text. The alternative text then only names the image,
  for example "Conference poster".
- A map or chart cannot be described in one sentence. Put its information in
  the text next to it as well.
- Do not put the photographer or source here.

### Copyright

- The photographer or source goes here.
- In a news article the credit is shown under the image, and so it is on a
  text with image slide in a carousel. In other page content it is behind a
  small © button on the image.
- It is not shown on cards, in lists and on the large image at the top of a
  page.

### Shape and Size

- Use landscape images. The news cards on the homepage crop every image to
  16:9. The news list keeps the shape of the image, but crops tall images to a
  square.
- Keep faces and anything important away from the edges, so cropping does not
  cut them.
- Upload at least 2070 pixels wide. That is the largest size the site shows.
  Allowed types are png, gif, jpg, jpeg and webp, up to 20 MB.

### Shared Links

- The **Image** field of a news article and the **Teaser Image** field of a
  page are also the picture shown when the link is shared.
- Social networks show that picture at about 1200 x 630 pixels and crop the
  rest. A wide image with the subject in the middle works best.
- Without an image, the general Mountain Camp picture is used.

## Tables

- Use a table for data with rows and columns, never for layout.
- Every table needs a header row. If the first column names the rows, make it
  a header column too. Both are in the table tools of the text editor.
- No header cell is empty. Give the top left cell a name, such as "Package".
- Add a caption that says what the table shows. On small screens it is the
  name of the table for screen reader users.
- Do not let a symbol or an empty cell carry meaning.
- Do: "Included" and "Not included".
- Do not: a check mark in some cells and nothing in the others.

## Sitemap

The sitemap is the list of pages the site hands to search engines. News
articles and pages are on it automatically.

- Taking a page off the list is a step for a site administrator. Editors do not
  see this setting.
- The administrator opens the edit form, opens **Simple XML Sitemap** and
  chooses the option that starts with **Do not index this**.
- Ask for this when a page is not meant to be found through a search engine,
  such as a search page or a test page.
- This does not hide the page. People with the link still reach it, and a
  search engine can still find it through other links.

## Breadcrumb

The breadcrumb is the small trail above the title, for example
"Home › Program".

- For a page, the trail follows the main menu. A page placed under another
  page in **Menu settings** shows that page in its trail.
- News articles show "Home › News" by themselves. Nothing to set.

## Before You Publish

- Title short and specific.
- Teaser filled in, plain text.
- Headings in order, one level below the title above them.
- Every link says where it goes, and every link opens the right page.
- Every image has its own alternative text.
- Tables have a header row and a caption.
