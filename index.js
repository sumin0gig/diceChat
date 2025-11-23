const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// ─────────────────────────────
// 1️⃣ 클라이언트 생성
// ─────────────────────────────
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ─────────────────────────────
// 2️⃣ 명령어 등록
// ─────────────────────────────
const commands = [
  new SlashCommandBuilder()
    .setName('roll')
    .setDescription('주사위를 굴립니다! 예: /roll 2d6+3')
    .addStringOption(option =>
      option
        .setName('dice')
        .setDescription('주사위 형식 (예: 1d20, 2d6+3 등)')
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

// ─────────────────────────────
// 3️⃣ Discord API에 Slash Command 등록
// ─────────────────────────────
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🚀 슬래시 명령어 등록 중...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('✅ 명령어 등록 완료!');
  } catch (error) {
    console.error(error);
  }
})();

// ─────────────────────────────
// 4️⃣ 명령어 실행 로직
// ─────────────────────────────
client.on('ready', () => {
  console.log(`🤖 로그인 완료! 봇 이름: ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === 'roll') {
    const diceInput = interaction.options.getString('dice'); // 예: "2d6+3"

    // 🎯 1d6, 2d10+3, 3d4-2, 1d2*3+1 모두 매칭
    const match = diceInput.match(/^(\d+)d(\d+)(\*(\d+))?([+-]\d+)?$/i);
    if (!match) {
      await interaction.reply('⚠️ 올바른 형식으로 입력해주세요! 예: `/roll 2d6+3` 또는 `/roll 1d20`');
      return;
    }

    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);
    const multiplyCount = match[4] ? parseInt(match[4]) : 1;
    const modifier = match[5] ? parseInt(match[5]) : 0;

    if (count <= 0 || sides <= 0 || multiplyCount <= 0) {
      await interaction.reply('⚠️ 주사위 수, 면의 수, 곱셈 수는 1 이상이어야 해요!');
      return;
    }

    // 주사위 굴리기 (* 연산이 있으면 count * multiplyCount번 굴림)
    const totalDiceCount = count * multiplyCount;
    const rolls = Array.from({ length: totalDiceCount }, () => Math.floor(Math.random() * sides) + 1);
    const sum = rolls.reduce((a, b) => a + b, 0);
    const total = sum + modifier;

    // 결과 포맷팅
    const rollsDisplay = `[${rolls.join(' + ')}]`;
    let modifierText = '';
    if (modifier !== 0) {
      modifierText = modifier > 0 ? ` +${modifier}` : ` ${modifier}`;
    }
    
    const result = `${rollsDisplay}${modifierText}\n\n **${total}**`;

    await interaction.reply(`🎲 ${diceInput}\n\n${result}`);
  }
});

client.login(TOKEN);
