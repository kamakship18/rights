"""
IPC (Indian Penal Code) and BNS (Bharatiya Nyaya Sanhita 2023) sections.

Curated subset of ~55 most-cited IPC sections mapped to their BNS equivalents.
Each entry: section number, title, body text, IPC/BNS mapping.

Source: Government of India — The Indian Penal Code, 1860 (Act No. 45 of 1860)
        and Bharatiya Nyaya Sanhita, 2023 (Act No. 45 of 2023).
Licence: Government of India Open Data Licence.
"""

SECTIONS: list[dict] = [
    # ── Offences Against the Person ────────────────────
    {
        "source": "IPC",
        "section": "299",
        "title": "Culpable homicide",
        "bns_section": "100",
        "body": "Whoever causes death by doing an act with the intention of causing death, or with the intention of causing such bodily injury as is likely to cause death, or with the knowledge that he is likely by such act to cause death, commits the offence of culpable homicide.",
    },
    {
        "source": "IPC",
        "section": "300",
        "title": "Murder",
        "bns_section": "101",
        "body": "Except in the cases hereinafter excepted, culpable homicide is murder, if the act by which the death is caused is done with the intention of causing death, or if it is done with the intention of causing such bodily injury as the offender knows to be likely to cause the death of the person to whom the harm is caused.",
    },
    {
        "source": "IPC",
        "section": "302",
        "title": "Punishment for murder",
        "bns_section": "103",
        "body": "Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine.",
    },
    {
        "source": "IPC",
        "section": "304",
        "title": "Punishment for culpable homicide not amounting to murder",
        "bns_section": "105",
        "body": "Whoever commits culpable homicide not amounting to murder shall be punished with imprisonment for life, or imprisonment of either description for a term which may extend to ten years, and shall also be liable to fine.",
    },
    {
        "source": "IPC",
        "section": "304A",
        "title": "Causing death by negligence",
        "bns_section": "106",
        "body": "Whoever causes the death of any person by doing any rash or negligent act not amounting to culpable homicide, shall be punished with imprisonment of either description for a term which may extend to two years, or with fine, or with both.",
    },
    {
        "source": "IPC",
        "section": "304B",
        "title": "Dowry death",
        "bns_section": "80",
        "body": "Where the death of a woman is caused by any burns or bodily injury or occurs otherwise than under normal circumstances within seven years of her marriage and it is shown that soon before her death she was subjected to cruelty or harassment by her husband or any relative of her husband for, or in connection with, any demand for dowry, such death shall be called 'dowry death'.",
    },
    # ── Assault / Hurt ─────────────────────────────────
    {
        "source": "IPC",
        "section": "319",
        "title": "Hurt",
        "bns_section": "114",
        "body": "Whoever causes bodily pain, disease or infirmity to any person is said to cause hurt.",
    },
    {
        "source": "IPC",
        "section": "320",
        "title": "Grievous hurt",
        "bns_section": "115",
        "body": "The following kinds of hurt only are designated as 'grievous': emasculation, permanent privation of the sight of either eye, permanent privation of the hearing of either ear, privation of any member or joint, destruction or permanent impairing of the powers of any member or joint, permanent disfiguration of the head or face, fracture or dislocation of a bone or tooth, any hurt which endangers life or causes the sufferer to be in severe bodily pain.",
    },
    {
        "source": "IPC",
        "section": "323",
        "title": "Punishment for voluntarily causing hurt",
        "bns_section": "115(2)",
        "body": "Whoever, except in the case provided for by section 334, voluntarily causes hurt, shall be punished with imprisonment of either description for a term which may extend to one year, or with fine which may extend to one thousand rupees, or with both.",
    },
    {
        "source": "IPC",
        "section": "325",
        "title": "Punishment for voluntarily causing grievous hurt",
        "bns_section": "117",
        "body": "Whoever, except in the case provided for by section 335, voluntarily causes grievous hurt, shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.",
    },
    {
        "source": "IPC",
        "section": "326",
        "title": "Voluntarily causing grievous hurt by dangerous weapons or means",
        "bns_section": "118",
        "body": "Whoever, except in the case provided for by section 335, voluntarily causes grievous hurt by means of any instrument for shooting, stabbing or cutting, or any instrument which, used as a weapon of offence, is likely to cause death, or by means of fire or any heated substance, or by means of any poison or any corrosive substance, or by means of any explosive substance, or by means of any substance which it is deleterious to the human body to inhale, to swallow, or to receive into the blood.",
    },
    {
        "source": "IPC",
        "section": "351",
        "title": "Assault",
        "bns_section": "131",
        "body": "Whoever makes any gesture, or any preparation intending or knowing it to be likely that such gesture or preparation will cause any person present to apprehend that he who makes that gesture or preparation is about to use criminal force to that person, is said to commit an assault.",
    },
    {
        "source": "IPC",
        "section": "352",
        "title": "Punishment for assault or criminal force otherwise than on grave provocation",
        "bns_section": "74",
        "body": "Whoever assaults or uses criminal force to any person otherwise than on grave and sudden provocation given by that person, shall be punished with imprisonment of either description for a term which may extend to three months, or with fine which may extend to five hundred rupees, or with both.",
    },
    # ── Sexual Offences / Harassment ───────────────────
    {
        "source": "IPC",
        "section": "354",
        "title": "Assault or criminal force to woman with intent to outrage her modesty",
        "bns_section": "74",
        "body": "Whoever assaults or uses criminal force to any woman, intending to outrage or knowing it to be likely that he will thereby outrage her modesty, shall be punished with imprisonment of either description for a term which shall not be less than one year but which may extend to five years, and shall also be liable to fine.",
    },
    {
        "source": "IPC",
        "section": "354A",
        "title": "Sexual harassment and punishment for sexual harassment",
        "bns_section": "75",
        "body": "A man committing any of the following acts: (i) physical contact and advances involving unwelcome and explicit sexual overtures; (ii) a demand or request for sexual favours; (iii) showing pornography against the will of a woman; (iv) making sexually coloured remarks, shall be guilty of the offence of sexual harassment.",
    },
    {
        "source": "IPC",
        "section": "354B",
        "title": "Assault or use of criminal force to woman with intent to disrobe",
        "bns_section": "76",
        "body": "Any man who assaults or uses criminal force to any woman or abets such act with the intention of disrobing or compelling her to be naked, shall be punished with imprisonment of either description for a term which shall not be less than three years but which may extend to seven years, and shall also be liable to fine.",
    },
    {
        "source": "IPC",
        "section": "354C",
        "title": "Voyeurism",
        "bns_section": "77",
        "body": "Any man who watches, or captures the image of a woman engaging in a private act in circumstances where she would usually have the expectation of not being observed either by the perpetrator or by any other person at the behest of the perpetrator or disseminates such image shall be punished on first conviction with imprisonment of either description for a term which shall not be less than one year, but which may extend to three years, and shall also be liable to fine.",
    },
    {
        "source": "IPC",
        "section": "354D",
        "title": "Stalking",
        "bns_section": "78",
        "body": "Any man who follows a woman and contacts, or attempts to contact such woman to foster personal interaction repeatedly despite a clear indication of disinterest by such woman; or monitors the use by a woman of the internet, email or any other form of electronic communication, commits the offence of stalking. Punishment: imprisonment for a term which may extend to three years on first conviction, and five years on subsequent conviction.",
    },
    {
        "source": "IPC",
        "section": "375",
        "title": "Rape",
        "bns_section": "63",
        "body": "A man is said to commit rape if he penetrates his penis, to any extent, into the vagina, mouth, urethra or anus of a woman or makes her to do so with him or any other person; or inserts, to any extent, any object or a part of the body, not being the penis, into the vagina, the urethra or anus of a woman, without her consent or against her will.",
    },
    {
        "source": "IPC",
        "section": "376",
        "title": "Punishment for rape",
        "bns_section": "64",
        "body": "Whoever commits rape shall be punished with rigorous imprisonment of either description for a term which shall not be less than ten years, but which may extend to imprisonment for life, and shall also be liable to fine.",
    },
    {
        "source": "IPC",
        "section": "498A",
        "title": "Husband or relative of husband of a woman subjecting her to cruelty",
        "bns_section": "85",
        "body": "Whoever, being the husband or the relative of the husband of a woman, subjects such woman to cruelty shall be punished with imprisonment for a term which may extend to three years and shall also be liable to fine. Cruelty means (a) any wilful conduct which is of such a nature as is likely to drive the woman to commit suicide or to cause grave injury or danger to life, limb or health; (b) harassment of the woman where such harassment is with a view to coercing her or any person related to her to meet any unlawful demand for any property or valuable security.",
    },
    # ── Theft / Property ───────────────────────────────
    {
        "source": "IPC",
        "section": "378",
        "title": "Theft",
        "bns_section": "303",
        "body": "Whoever, intending to take dishonestly any moveable property out of the possession of any person without that person's consent, moves that property in order to such taking, is said to commit theft.",
    },
    {
        "source": "IPC",
        "section": "379",
        "title": "Punishment for theft",
        "bns_section": "303(2)",
        "body": "Whoever commits theft shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both.",
    },
    {
        "source": "IPC",
        "section": "380",
        "title": "Theft in dwelling house",
        "bns_section": "305",
        "body": "Whoever commits theft in any building, tent or vessel, which building, tent or vessel is used as a human dwelling, or used for the custody of property, shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.",
    },
    {
        "source": "IPC",
        "section": "383",
        "title": "Extortion",
        "bns_section": "308",
        "body": "Whoever intentionally puts any person in fear of any injury to that person, or to any other, and thereby dishonestly induces the person so put in fear to deliver to any person any property or valuable security, or anything signed or sealed which may be converted into a valuable security, commits extortion.",
    },
    {
        "source": "IPC",
        "section": "390",
        "title": "Robbery",
        "bns_section": "309",
        "body": "In all robbery there is either theft or extortion. When theft is robbery: Theft is robbery if, in order to the committing of the theft, or in committing the theft, or in carrying away or attempting to carry away property obtained by the theft, the offender, for that end, voluntarily causes or attempts to cause to any person death or hurt or wrongful restraint, or fear of instant death or of instant hurt, or of instant wrongful restraint.",
    },
    {
        "source": "IPC",
        "section": "392",
        "title": "Punishment for robbery",
        "bns_section": "309(4)",
        "body": "Whoever commits robbery shall be punished with rigorous imprisonment for a term which may extend to ten years, and shall also be liable to fine; and, if the robbery be committed on the highway between sunset and sunrise, the imprisonment may be extended to fourteen years.",
    },
    # ── Cheating / Fraud ───────────────────────────────
    {
        "source": "IPC",
        "section": "415",
        "title": "Cheating",
        "bns_section": "318",
        "body": "Whoever, by deceiving any person, fraudulently or dishonestly induces the person so deceived to deliver any property to any person, or to consent that any person shall retain any property, or intentionally induces the person so deceived to do or omit to do anything which he would not do or omit if he were not so deceived, and which act or omission causes or is likely to cause damage or harm to that person in body, mind, reputation or property, is said to cheat.",
    },
    {
        "source": "IPC",
        "section": "420",
        "title": "Cheating and dishonestly inducing delivery of property",
        "bns_section": "318(4)",
        "body": "Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person, or to make, alter or destroy the whole or any part of a valuable security, or anything which is signed or sealed, and which is capable of being converted into a valuable security, shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.",
    },
    {
        "source": "IPC",
        "section": "406",
        "title": "Punishment for criminal breach of trust",
        "bns_section": "316",
        "body": "Whoever commits criminal breach of trust shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both.",
    },
    # ── Kidnapping ─────────────────────────────────────
    {
        "source": "IPC",
        "section": "359",
        "title": "Kidnapping",
        "bns_section": "137",
        "body": "Kidnapping is of two kinds: kidnapping from India, and kidnapping from lawful guardianship. Whoever takes or entices any minor under sixteen years of age if a male, or under eighteen years of age if a female, or any person of unsound mind, out of the keeping of the lawful guardian of such minor or person of unsound mind, without the consent of such guardian, is said to kidnap such minor or person from lawful guardianship.",
    },
    {
        "source": "IPC",
        "section": "363",
        "title": "Punishment for kidnapping",
        "bns_section": "137(2)",
        "body": "Whoever kidnaps any person from India or from lawful guardianship, shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.",
    },
    # ── Defamation / Intimidation ──────────────────────
    {
        "source": "IPC",
        "section": "499",
        "title": "Defamation",
        "bns_section": "356",
        "body": "Whoever, by words either spoken or intended to be read, or by signs or by visible representations, makes or publishes any imputation concerning any person intending to harm, or knowing or having reason to believe that such imputation will harm, the reputation of such person, is said to defame that person.",
    },
    {
        "source": "IPC",
        "section": "500",
        "title": "Punishment for defamation",
        "bns_section": "356(2)",
        "body": "Whoever defames another shall be punished with simple imprisonment for a term which may extend to two years, or with fine, or with both.",
    },
    {
        "source": "IPC",
        "section": "503",
        "title": "Criminal intimidation",
        "bns_section": "351",
        "body": "Whoever threatens another with any injury to his person, reputation or property, or to the person or reputation of any one in whom that person is interested, with intent to cause alarm to that person, or to cause that person to do any act which he is not legally bound to do, or to omit to do any act which that person is legally entitled to do, as the means of avoiding the execution of such threat, commits criminal intimidation.",
    },
    {
        "source": "IPC",
        "section": "506",
        "title": "Punishment for criminal intimidation",
        "bns_section": "351(2)",
        "body": "Whoever commits the offence of criminal intimidation shall be punished with imprisonment of either description for a term which may extend to two years, or with fine, or with both; if threat be to cause death or grievous hurt — imprisonment which may extend to seven years, or fine, or both.",
    },
    # ── Trespass / Mischief ────────────────────────────
    {
        "source": "IPC",
        "section": "441",
        "title": "Criminal trespass",
        "bns_section": "329",
        "body": "Whoever enters into or upon property in the possession of another with intent to commit an offence or to intimidate, insult or annoy any person in possession of such property, or having lawfully entered into or upon such property, unlawfully remains there with intent thereby to intimidate, insult or annoy any such person, or with intent to commit an offence, is said to commit criminal trespass.",
    },
    {
        "source": "IPC",
        "section": "447",
        "title": "Punishment for criminal trespass",
        "bns_section": "329(2)",
        "body": "Whoever commits criminal trespass shall be punished with imprisonment of either description for a term which may extend to three months, or with fine which may extend to five hundred rupees, or with both.",
    },
    {
        "source": "IPC",
        "section": "425",
        "title": "Mischief",
        "bns_section": "324",
        "body": "Whoever with intent to cause, or knowing that he is likely to cause, wrongful loss or damage to the public or to any person, causes the destruction of any property, or any such change in any property or in the situation thereof as destroys or diminishes its value or utility, or affects it injuriously, commits mischief.",
    },
    # ── Corruption ─────────────────────────────────────
    {
        "source": "IPC",
        "section": "161",
        "title": "Public servant taking gratification other than legal remuneration",
        "bns_section": "201",
        "body": "Whoever, being or expecting to be a public servant, accepts or obtains or agrees to accept or attempts to obtain from any person, for himself or for any other person, any gratification whatever, other than legal remuneration, as a motive or reward for doing or forbearing to do any official act or for showing or forbearing to show, in the exercise of his official functions, favour or disfavour to any person or for rendering or attempting to render any service or disservice to any person, shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both.",
    },
    # ── Forgery ────────────────────────────────────────
    {
        "source": "IPC",
        "section": "463",
        "title": "Forgery",
        "bns_section": "336",
        "body": "Whoever makes any false document or false electronic record or part of a document or electronic record, with intent to cause damage or injury, to the public or to any person, or to support any claim or title, or to cause any person to part with property, or to enter into any express or implied contract, or with intent to commit fraud or that fraud may be committed, commits forgery.",
    },
    {
        "source": "IPC",
        "section": "468",
        "title": "Forgery for purpose of cheating",
        "bns_section": "338",
        "body": "Whoever commits forgery, intending that the document or electronic record forged shall be used for the purpose of cheating, shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.",
    },
    # ── Cybercrime (IT Act reference via IPC) ──────────
    {
        "source": "IPC",
        "section": "66A (IT Act 2000)",
        "title": "Punishment for sending offensive messages through communication service (struck down by SC)",
        "bns_section": "N/A (struck down)",
        "body": "Any person who sends, by means of a computer resource or a communication device, any information that is grossly offensive or has menacing character, or any information which he knows to be false, but for the purpose of causing annoyance, inconvenience, danger, obstruction, insult, injury, criminal intimidation, enmity, hatred or ill will. Note: This section was struck down as unconstitutional by the Supreme Court in Shreya Singhal v. Union of India (2015).",
    },
    {
        "source": "IT Act 2000",
        "section": "66",
        "title": "Computer related offences",
        "bns_section": "N/A",
        "body": "If any person, dishonestly, or fraudulently, does any act referred to in section 43, he shall be punishable with imprisonment for a term which may extend to three years or with fine which may extend to five lakh rupees or with both. Section 43 acts include: accessing a computer without permission, downloading data, introducing virus, damaging a computer, disrupting access.",
    },
    {
        "source": "IT Act 2000",
        "section": "66C",
        "title": "Punishment for identity theft",
        "bns_section": "N/A",
        "body": "Whoever, fraudulently or dishonestly make use of the electronic signature, password or any other unique identification feature of any other person, shall be punished with imprisonment of either description for a term which may extend to three years and shall also be liable to fine which may extend to rupees one lakh.",
    },
    {
        "source": "IT Act 2000",
        "section": "67",
        "title": "Punishment for publishing or transmitting obscene material in electronic form",
        "bns_section": "N/A",
        "body": "Whoever publishes or transmits or causes to be published or transmitted in the electronic form, any material which is lascivious or appeals to the prurient interest or if its effect is such as to tend to deprave and corrupt persons, shall be punished on first conviction with imprisonment of either description for a term which may extend to three years and with fine which may extend to five lakh rupees.",
    },
    # ── Public Nuisance ────────────────────────────────
    {
        "source": "IPC",
        "section": "268",
        "title": "Public nuisance",
        "bns_section": "292",
        "body": "A person is guilty of a public nuisance who does any act or is guilty of an illegal omission which causes any common injury, danger or annoyance to the public or to the people in general who dwell or occupy property in the vicinity, or which must necessarily cause injury, obstruction, danger or annoyance to persons who may have occasion to use any public right.",
    },
    {
        "source": "IPC",
        "section": "290",
        "title": "Punishment for public nuisance in cases not otherwise provided for",
        "bns_section": "292(2)",
        "body": "Whoever commits a public nuisance in any case not otherwise punishable by this Code, shall be punished with fine which may extend to two hundred rupees.",
    },
    # ── Domestic Violence (Special Act) ────────────────
    {
        "source": "DV Act 2005",
        "section": "3",
        "title": "Definition of domestic violence",
        "bns_section": "N/A",
        "body": "For the purposes of this Act, any act, omission or commission or conduct of the respondent shall constitute domestic violence in case it: (a) harms or injures or endangers the health, safety, life, limb or well-being, whether mental or physical, of the aggrieved person or tends to do so and includes causing physical abuse, sexual abuse, verbal and emotional abuse and economic abuse; (b) harasses, harms, injures or endangers the aggrieved person with a view to coerce her or any other person related to her to meet any unlawful demand for any dowry or other property or valuable security.",
    },
    {
        "source": "DV Act 2005",
        "section": "12",
        "title": "Application to Magistrate for protection order",
        "bns_section": "N/A",
        "body": "An aggrieved person or a Protection Officer or any other person on behalf of the aggrieved person may present an application to the Magistrate seeking one or more reliefs under this Act.",
    },
    {
        "source": "DV Act 2005",
        "section": "18",
        "title": "Protection orders",
        "bns_section": "N/A",
        "body": "The Magistrate may, after giving the aggrieved person and the respondent an opportunity of being heard and on being prima facie satisfied that domestic violence has taken place or is likely to take place, pass a protection order in favour of the aggrieved person.",
    },
    # ── POSH Act ───────────────────────────────────────
    {
        "source": "POSH Act 2013",
        "section": "2(n)",
        "title": "Definition of sexual harassment",
        "bns_section": "N/A",
        "body": "Sexual harassment includes any one or more of the following unwelcome acts or behaviour: (i) physical contact and advances; (ii) a demand or request for sexual favours; (iii) making sexually coloured remarks; (iv) showing pornography; (v) any other unwelcome physical, verbal or non-verbal conduct of sexual nature.",
    },
    {
        "source": "POSH Act 2013",
        "section": "4",
        "title": "Constitution of Internal Complaints Committee",
        "bns_section": "N/A",
        "body": "Every employer of a workplace shall, by an order in writing, constitute a Committee to be known as the Internal Complaints Committee.",
    },
    {
        "source": "POSH Act 2013",
        "section": "9",
        "title": "Complaint of sexual harassment",
        "bns_section": "N/A",
        "body": "Any aggrieved woman may make, in writing, a complaint of sexual harassment at workplace to the Internal Complaints Committee if so constituted, or the Local Complaints Committee, in case it is not so constituted, within a period of three months from the date of the incident.",
    },
    # ── Consumer Protection ────────────────────────────
    {
        "source": "Consumer Protection Act 2019",
        "section": "2(7)",
        "title": "Consumer defined",
        "bns_section": "N/A",
        "body": "Consumer means any person who buys any goods for a consideration which has been paid or promised or partly paid and partly promised, or under any system of deferred payment and includes any user of such goods other than the person who buys such goods for consideration paid or promised or partly paid or partly promised, or under any system of deferred payment, when such use is made with the approval of such person.",
    },
    {
        "source": "Consumer Protection Act 2019",
        "section": "35",
        "title": "Jurisdiction of District Commission",
        "bns_section": "N/A",
        "body": "Subject to the other provisions of this Act, the District Commission shall have jurisdiction to entertain complaints where the value of the goods or services paid as consideration does not exceed one crore rupees.",
    },
]
