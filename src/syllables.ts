// Tone-free Mandarin syllables used to build each layout's reverse lookup table.
// `v` is the ASCII spelling of ü so the output can be pasted into search fields.
const syllables = `
a ai an ao ang ba bi bo bu bai ban bao bei ben bie bin bang beng bian biao bing
ca ce ci cu cai can cao cen cha che chi chu cou cui cun cuo cang ceng chai chan chao chen chou chua chui chun chuo cong cuan chang cheng chong chuai chuan chuang
da de di du dai dan dao dei den dia die diu dou dui dun duo dang deng dian diao ding dong duan
e ei en er eng
fa fo fu fan fei fen fou fang feng
ga ge gu gai gan gao gei gen gou gua gui gun guo gang geng gong guai guan guang
ha he hu hai han hao hei hen hou hua hui hun huo hang heng hong huai huan huang
ji ju jia jie jin jiu jue jun jian jiao jing juan jiang jiong
ka ke ku kai kan kao kei ken kou kua kui kun kuo kang keng kong kuai kuan kuang
la le li lo lu lv lai lan lao lei lia lie lin liu lou lun luo lve lang leng lian liao ling long luan liang
ma me mi mo mu mai man mao mei men mie min miu mou mang meng mian miao ming
na ne ni nu nv nai nan nao nei nen nie nin niu nou nuo nve nang neng nian niao ning nong nuan niang
o ou
pa pi po pu pai pan pao pei pen pie pin pou pang peng pian piao ping
qi qu qia qie qin qiu que qun qian qiao qing quan qiang qiong
re ri ru ran rao ren rou rua rui run ruo rang reng rong ruan
sa se si su sai san sao sen sha she shi shu sou sui sun suo sang seng shai shan shao shei shen shou shua shui shun shuo song suan shang sheng shuai shuan shuang
ta te ti tu tai tan tao tie tou tui tun tuo tang teng tian tiao ting tong tuan
wa wo wu wai wan wei wen wang weng
xi xu xia xie xin xiu xue xun xian xiao xing xuan xiang xiong
ya ye yi yo yu yan yao yin you yue yun yang ying yong yuan
za ze zi zu zai zan zao zei zen zha zhe zhi zhu zou zui zun zuo zang zeng zhai zhan zhao zhei zhen zhou zhua zhui zhun zhuo zong zuan zhang zheng zhong zhuai zhuan zhuang
`;

export const PINYIN_SYLLABLES = Object.freeze(syllables.trim().split(/\s+/));
