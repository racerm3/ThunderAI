# ![ThunderAI icon](images/icon-32px.png "ThunderAI") ThunderAI

ThunderAI is a Thunderbird Addon that uses the capabilities of AI to enhance email management.

ThunderAI enables users to summarize, spam detection, write, correct, assign tags, create calendar events or tasks and optimize their emails, facilitating more effective and professional communication.

ThunderAI is a tool for anyone looking to improve their email quality, both in content and grammar, making the writing process quicker and more intuitive. 

You can also define, export and import your own **[custom prompts](https://micz.it/thunderbird-addon-thunderai/custom-prompts/)**!

In any custom prompt you can use additional **[data placeholders](https://micz.it/thunderbird-addon-thunderai/data-placeholders/)**!

Using an API integration, you can activate some automatic features:
- Tagging incoming emails
- Summarizing incoming emails
- Checking incoming emails for spam, and permanently deleting those that score above your threshold


## How Incoming Emails Are Processed (Spam & Summary)

When a new email arrives (or you open one), ThunderAI may act on it, depending on your settings.

Background actions run only while they are enabled. 

When a new email arrives, ThunderAI:
1. Collects the new messages.
2. Checks how to handle this folder:
   - If it is a **Junk** folder and *"don't scan junk"* is enabled, spam filtering is **turned off** here.
   - Otherwise, spam filtering follows its **main toggle**.
3. For **each** message, checks whether the sender is on the **summary allow-list**:
   - If so, the email is summarized (and spam is normally skipped for that sender).

The message then flows through **two independent features** — **Spam Check** and **Summarize**.

### Spam Check

Spam check runs when it is enabled and the message is from an enabled account.

The check runs in this order:

1. **Skip address-list** — is the sender on your *"never check"* addresses?
   - **Yes** → log it as *not spam*, write one log entry, and stop.
   - **No** → continue.
2. **Address book** — is the sender in your address book?
   - **Yes** → stop quietly. **No** log entry, no flash, **no deletion**.
   - **No** → continue.
3. **Blocked domains** — is the sender's domain on your blocked list?
   - **Yes** → treat it as 100% spam: **permanently delete** the email, write one log entry, and stop.
   - **No** → continue.
4. **AI scoring** — ask the AI to score the email from 0 to 100. It waits briefly first so your custom filters can run.

Finally, compare the score with your spam threshold:

| Score vs. threshold | Result |
| --- | --- |
| **Below the threshold** | Show a *"not spam"* report, log one entry, and **keep** the email. |
| **At or above the threshold** | **Mark as junk** and **permanently delete** the email. Log *"Spam Log"* entry. *(The sender's domain may be auto-blocked if enabled.)* |

### Summarize

1. **Already cached?** Is a summary already saved?
   - **Yes** → return it (no AI call).
   - **No** → continue.
2. **Already generating?** Is a summary already being produced?
   - **Yes** → show *"generating…"* and wait.
   - **No** → continue.
3. Send the email to the AI, get the summary back, and **save it to the cache**.
4. **Ran in the background (on receive)?**
   - **Yes** → stored silently; opening the email later shows it instantly from the cache.
   - **No** (requested on-screen) → show the summary in the reading pane.

### In short

- **Spam:** If eligible → skip-list? → address book? → blocked domain? → AI score. Under the threshold = *"not spam"*; at/over the threshold = marked junk and **permanently deleted**. Address-book senders are skipped with **no log entry**.
- **Summary:** generated in the background on receive or on open → cached? → already generating? → AI → saved → shown.

The two features are **independent** — an email can get a summary even while being spam-checked, and deleting it for spam happens regardless of summarization.

## AI Integrations

- **ChatGPT Web**
  - There is no need for an API key!
  - You can use a free account!
- **OpenAI API**
  - Connect directly to ChatGPT using your API key.
- **Google Gemini**
  - You can use also the _System Instructions_ and _thinkingBudget_ options if needed.
- **Claude API**
  - You need to grant the permission "_Access your data for sites in the https://anthropic.com domain_" to use the Claude API.
- **Using Ollama**
  - Just remember to add `OLLAMA_ORIGINS = moz-extension://*` to the Ollama server environment variables.
  - [More info about CORS](https://micz.it/thunderbird-addon-thunderai/ollama-cors-information/)
- **OpenAI Compatible API**
  - You can also use a local OpenAI Compatible API server, like LM Studio or Mistral AI!
  - There is also an option to remove the "v1" segment from the API url, if needed, and to manually set the model name if the server doesn't have a models list endpoint.
  - You can also use one of these predefined configurations:
    - DeepSeek API
    - Grok API
    - Mistral API
    - OpenRouter API
    - Perplexity API



## Documentation

[Setup Guides](https://micz.it/thunderbird-addon-thunderai/guides/) - Step-by-step guides to connect ThunderAI to the AI backend of your choice, from ChatGPT to local models with Ollama.

[Custom Prompt Tutorial](https://micz.it/thunderbird-addon-thunderai/tutorial/) - Learn how to build your first custom prompt from scratch, combining placeholders and user input to automate your email replies.

[ThunderAI Prompt Architect](https://chatgpt.com/g/g-69b6b11c89b88191a6798be6e97025f1-thunder-ai-prompt-architect) - Let ChatGPT help you crafting your custom prompts. Thanks to [Paweł](https://github.com/PawelKinczyk) for this tool!


## Translations
Do you want to help translate this addon?

[Find out how!](https://micz.it/thunderbird-addon-thunderai/translate/)


## Changelog
ThunderAI's changes are logged [here](CHANGELOG.md).


## Privacy and Permissions
You can find all the information on [this page](https://micz.it/thunderbird-addon-thunderai/privacy-permissions/).


## Support this addon!
Are you using this addon in your Thunderbird?
Consider to support the development making a small donation. [Click here!](https://www.paypal.com/donate/?business=UHN4SXPGEXWQL&no_recurring=1&item_name=Thunderbird+Addon+ThunderAI&currency_code=EUR)


## Attributions

### Translations
- Brazilian Portuguese - Português Brasileiro (pt-br): Bruno Pereira de Souza <img src="https://micz.it/weblate/thunderai/pt-br.svg">
- Chinese (Simplified) - Jiǎntǐ Zhōngwén (简体中文) (zh_Hans): [jeklau](https://github.com/jeklau), [Min9X1n](https://github.com/Min9X1n) <img src="https://micz.it/weblate/thunderai/zh_Hans.svg">
- Chinese (Traditional) - Fántǐ Zhōngwén (繁體中文) (zh_Hant): [evez](https://github.com/evez) <img src="https://micz.it/weblate/thunderai/zh_Hant.svg">
- Croatian - Hrvatski (hr): Petar Jedvaj <img src="https://micz.it/weblate/thunderai/hr.svg">
- Czech - Čeština (cs): [Fjuro](https://hosted.weblate.org/user/Fjuro/), [Jaroslav Staněk](https://hosted.weblate.org/user/jaroush/) <img src="https://micz.it/weblate/thunderai/cs.svg">
- French - Français (fr): Generated automatically, [Noam](https://github.com/noam-sc) <img src="https://micz.it/weblate/thunderai/fr.svg">
- German - Deutsch (de): Generated automatically <img src="https://micz.it/weblate/thunderai/de.svg">
- Greek - Elliniká (Ελληνικά) (el): [ChristosK.](https://github.com/christoskaterini) <img src="https://micz.it/weblate/thunderai/el.svg">
- Italian - Italiano (it): [Mic](https://github.com/micz) <img src="https://micz.it/weblate/thunderai/it.svg">
- Japanese - Nihongo (日本語) (ja): [Taichi Ito](https://github.com/watya1) <img src="https://micz.it/weblate/thunderai/ja.svg">
- Polish - Polski (pl): [neexpl](https://github.com/neexpl), [makkacprzak](https://github.com/makkacprzak) <img src="https://micz.it/weblate/thunderai/pl.svg">
- Russian - Russkiy (русский) (ru): [Maksim](https://hosted.weblate.org/user/law820314/) <img src="https://micz.it/weblate/thunderai/ru.svg">
- Spanish - Español (es): [Gerardo Sobarzo](https://hosted.weblate.org/user/gerardo.sobarzo/), [Andrés Rendón Hernández](https://hosted.weblate.org/user/arendon/), [Erick Limon](https://hosted.weblate.org/user/ErickLimonG/) <img src="https://micz.it/weblate/thunderai/es.svg">
- Swedish - Svenska (sv): [Andreas Pettersson](https://hosted.weblate.org/user/Andy_tb/), [Luna Jernberg](https://hosted.weblate.org/user/bittin1ddc447d824349b2/) <img src="https://micz.it/weblate/thunderai/sv.svg">

Do you want to help translate this addon? [Find out how!](https://micz.it/thunderbird-addon-thunderai/translate/)
_The language status represents the percentage of translated strings in the latest stable release._


### Graphics
- ChatGPT-4 for the help with the addon icon ;-)
- [loading.io](https://loading.io) for the loading SVGs
- [Fluent Design System](https://www.iconfinder.com/fluent-designsystem) for the Custom Prompts table sorting icons
- [JessiGue](https://www.flaticon.com/authors/jessigue) for the show/hide icon for api key fields
- [Iconka.com](https://www.iconarchive.com/artist/iconka.html) for the autotag context menu icon
- [Icojam](https://www.iconarchive.com/artist/icojam.html) for the spam filter context menu icon
- [Roundicons](https://www.flaticon.com/authors/roundicons) for the summarize context menu icon
- [HideMau](https://www.flaticon.com/authors/hidemaru) for the ai summarize icon
- [Hilmy Abiyyu A.](https://www.flaticon.com/authors/hilmy-abiyyu-a) for the ai translate and context menu icons
- [bearicons](https://www.flaticon.com/authors/bearicons) for the empty context menu icon
- [meaicon](https://www.flaticon.com/authors/meaicon) for the add task context menu icon


### Miscellaneous
- [chatgpt.js](https://github.com/KudoAI/chatgpt.js) for providing methods to interact with the ChatGPT web frontend
- [Julian Harris](https://github.com/boxabirds) for his project that has been used as a starting point for the API Web Interface
- [Hosted Weblate](https://hosted.weblate.org/widgets/thunderai/) for managing the localization
