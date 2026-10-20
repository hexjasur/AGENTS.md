# @hexjasur/agents-md

`AGENTS.md` qoidalarini loyiha ichiga o‘rnatadi va o‘rnatilgan versiyani `.agents-md/installation.json` faylida qayd etadi. Node.js 18 yoki yangiroq versiya kerak.

## Foydalanish

```sh
npx @hexjasur/agents-md
npx @hexjasur/agents-md update
```

Shell skripti ham Node.js CLI’dan foydalanadi:

```sh
./install-agents.sh [init] [loyiha-papkasi]
./install-agents.sh update [loyiha-papkasi] [--force]
```

Loyihada `AGENTS.md` mavjud bo‘lsa, `init` uni o‘chirish, yangisiga almashtirish yoki bekor qilishni so‘raydi. Bo‘sh yoki tushunarsiz javob bekor qiladi. Interaktiv terminal bo‘lmasa, mavjud faylga tegilmaydi.

## Xavfsizlik

Manifest sxemasi, schema versiyasi, SemVer ko‘rinishidagi versiya, ISO sana va SHA-256 xeshi tekshiriladi. Versiya qiymati fayl yo‘li yoki tarmoq manzili sifatida ishlatilmaydi. Yaroqsiz manifest update’ni to‘xtatadi. O‘rnatilgandan so‘ng `AGENTS.md` o‘zgartirilgan bo‘lsa, update odatiy holatda rad etiladi; faqat `--force` bilan davom ettirish mumkin. Maqsad fayl va manifest symlink bo‘lsa, skript ishni rad etadi. Manifest yashirin `.agents-md` papkasida saqlanadi.

Bu SHA-256 xesh orqali o‘zgarishni aniqlaydi, lekin raqamli imzo emas: loyiha egasi manifest va faylni ikkalasini ham o‘zgartira oladi. CLI’ni faqat ishonchli manbadan ishga tushiring.

## Tekshiruv

```sh
npm test
npm pack --dry-run
```
